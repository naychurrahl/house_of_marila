<?php

require_once __DIR__ . '/Database.php';
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

class ExpiredException extends \Exception {}

function _DIR_(int $step = 0): string
{
    $dir = __DIR__;

    if ($step > 0) {
        $dir = dirname(__DIR__, $step);
    }

    return str_replace('\\', '/', $dir);
}

define('SECRET_KEY', include_once _DIR_(1) . '/config/jwt.php');
define('PAYSTACK_SECRET_KEY', include_once _DIR_(1) . '/config/paystack.php');
define('PAYSTACK_PUBLIC_KEY', include_once _DIR_(1) . '/config/paystack_public.php');

class Functions
{
    private const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h - hard cutoff, no refresh flow

    private array $userLoad = [];
    private bool $auth = False;

    public function __construct()
    {
        try {
            $this->verifyJWT();
        } catch (ExpiredException $th) {
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            $this->consoleLog("unexpected error occured. Try again later", 500);
        }
    }

    // === HELPER ===
    private function requireAuth(array $roles = []): void
    {
        if (!$this->auth) {
            $this->consoleLog(['error' => 'Unauthorized'], 401);
        }

        if ($roles && !in_array($this->userLoad['role'] ?? null, $roles, true)) {
            $this->consoleLog(['error' => 'Forbidden'], 403);
        }
    }

    private function check_required_fields(array $required, array $data): bool
    {
        $missing = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || trim(preg_replace('/\s+/', ' ', (string) $data[$field])) === '') {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            $this->consoleLog(['error' => "Missing fields: " . implode(', ', $missing)], 400);
            return false;
        }

        return true;
    }

    public function consoleLog(mixed $load, int $code = 200): void
    {
        http_response_code($code);

        if ($this->auth) {
            $this->manageCookies($this->userLoad);
        }
        exit(json_encode($load));
    }

    private function dbInsert(PDO $pdo, string $table, array $data): void
    {
        $cols = implode(', ', array_map(fn($col) => "`$col`", array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        try {
            $insertStmt = $pdo->prepare("INSERT INTO $table ($cols) VALUES ($placeholders)");
            $insertStmt->execute(array_values($data));
        } catch (PDOException $e) {
            throw new PDOException($e->getMessage(), (int) $e->getCode());
        }
    }

    private function dbUpdate(PDO $pdo, string $table, array $searchBy, array $data): bool
    {
        $setClauses = array_map(fn($col) => "`$col` = ?", array_keys($data));
        $setSQL = implode(', ', $setClauses);

        $whereClauses = array_map(fn($col) => "`$col` = ?", array_keys($searchBy));
        $whereSQL = implode(' AND ', $whereClauses);

        $stmt = $pdo->prepare("UPDATE $table SET $setSQL WHERE $whereSQL");
        $stmt->execute([...array_values($data), ...array_values($searchBy)]);

        return $stmt->rowCount() > 0;
    }

    private function dbDelete(PDO $pdo, string $table, array $searchBy): bool
    {
        $whereClauses = array_map(fn($col) => "`$col` = ?", array_keys($searchBy));
        $whereSQL = implode(' AND ', $whereClauses);

        $stmt = $pdo->prepare("DELETE FROM $table WHERE $whereSQL");
        $stmt->execute(array_values($searchBy));

        return $stmt->rowCount() > 0;
    }

    private function generateUniqueId(PDO $con, string $prefix, string $table, string $col = 'id'): string
    {
        $con->prepare("CALL generate_uniqid(?, 1, ?, ?, @newId)")->execute([$prefix, $table, $col]);
        return $con->query("SELECT @newId")->fetchColumn();
    }

    private function generateJWT(array $payload, string $secret = SECRET_KEY): string
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        $payload['iat'] = time();
        $payload['exp'] = time() + self::TOKEN_TTL_SECONDS;

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

        $signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return base64_encode("$base64UrlHeader.$base64UrlPayload.$base64UrlSignature");
    }

    private function manageCookies(array|null $data = null): string|null
    {
        $token = null;
        $period = 60 * 60 * 24 * 7;
        $time = time() - $period;

        if ($data) {
            $token = $this->generateJWT($data);
            $time = time() + $period;
        }

        // Secure cookies are silently dropped by browsers over plain HTTP, and
        // SameSite=None requires Secure - so over local http:// dev (frontend
        // and backend both on "localhost", just different ports, which is
        // still same-site) fall back to Lax without Secure.
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['SERVER_PORT'] ?? null) == 443;

        setcookie(
            "token",
            $token,
            [
                'expires' => $time,
                'path' => '/',
                'secure' => $isHttps,
                'httponly' => true,
                'samesite' => $isHttps ? 'none' : 'lax',
            ]
        );

        return $token;
    }

    private function verifyJWT(): void
    {
        try {
            $token = $_COOKIE['token'] ?? '';
            if (!$token) {
                $headers = getallheaders();
                $authHeader = $headers['Authorization'] ?? '';
                // Case-insensitive scheme match ("Bearer"/"bearer"/"BEARER") -
                // the HTTP spec treats auth schemes as case-insensitive, and
                // not every client capitalizes it the same way.
                $token = trim(preg_replace('/^bearer\s+/i', '', trim($authHeader)));
            }

            if (!$token) throw new ExpiredException('No token provided', 401);

            $token = base64_decode($token, 1);
            $parts = explode('.', $token);

            if (count($parts) !== 3) {
                throw new ExpiredException('Incomplete parts', 401);
            }

            list($header64, $payload64, $signatureProvided) = $parts;

            $signature = hash_hmac('sha256', $header64 . "." . $payload64, SECRET_KEY, true);
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            if (!hash_equals($base64UrlSignature, $signatureProvided))
                throw new ExpiredException('Forgery', 401);

            $payload = json_decode(base64_decode($payload64), true);

            if (!$payload) throw new ExpiredException('Authorization failed', 401);

            if (($payload['exp'] ?? 0) < time()) {
                throw new ExpiredException('Token expired', 401);
            }

            // The signature only proves the token wasn't tampered with, not
            // that the account it names still exists - a deleted/deactivated
            // user's old cookie would otherwise keep passing auth and crash
            // downstream (e.g. an FK violation) instead of failing cleanly.
            $db = Database::getInstance();
            $con = $db->connect();

            $stmt = $con->prepare("SELECT id, name, email, role, active, token_version FROM users WHERE id = ?");
            $stmt->execute([$payload['id'] ?? '']);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || $user['active'] !== 'active') {
                throw new ExpiredException('Session no longer valid, please log in again', 401);
            }

            // Revocation: logout/password-change bump this counter, which
            // instantly invalidates every token minted before the bump for
            // this account - including copies the legitimate user no longer
            // has (e.g. a token lifted from a compromised device).
            if ((int) $user['token_version'] !== (int) ($payload['tokenVersion'] ?? -1)) {
                throw new ExpiredException('Session revoked, please log in again', 401);
            }

            // Re-derive from the DB every request rather than trusting the
            // token's baked-in snapshot, so a name/role change (or the
            // rolling cookie refresh in consoleLog()) carries current data
            // forward instead of perpetuating whatever was true at login -
            // a demoted staff member's very next request reflects it, not
            // just their next login.
            $this->userLoad = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'tokenVersion' => (int) $user['token_version'],
            ];
            $this->auth = True;
        } catch (ExpiredException $th) {
            throw new ExpiredException($th->getMessage(), $th->getCode());
        } catch (\Throwable $th) {
            throw new Exception("unexpected error occured. Try again later", 500);
        }
    }

    private function mapProductRow(PDO $con, array $row): array
    {
        $id = $row['id'];

        $images = $con->prepare("SELECT image FROM product_images WHERE product_id = ? ORDER BY position");
        $images->execute([$id]);

        $sizes = $con->prepare("SELECT size FROM product_sizes WHERE product_id = ? ORDER BY position");
        $sizes->execute([$id]);

        $colors = $con->prepare("SELECT color FROM product_colors WHERE product_id = ? ORDER BY position");
        $colors->execute([$id]);

        $tags = $con->prepare("SELECT tag FROM product_tags WHERE product_id = ?");
        $tags->execute([$id]);

        return [
            'id' => $id,
            'name' => $row['name'],
            'price' => (float) $row['price'],
            'category' => $row['category'],
            'description' => $row['description'],
            'images' => $images->fetchAll(PDO::FETCH_COLUMN),
            'sizes' => $sizes->fetchAll(PDO::FETCH_COLUMN),
            'colors' => $colors->fetchAll(PDO::FETCH_COLUMN),
            'inStock' => (bool) $row['in_stock'],
            'tags' => $tags->fetchAll(PDO::FETCH_COLUMN),
            'collectionId' => $row['collection_id'],
        ];
    }

    // === HELPER! ===

    // == AUTH == ✅
    public function logIn(string $identifier, string $key): void
    {
        try {
            $db = Database::getInstance();
            $con = $db->connect();

            $stmt = $con->prepare("
                SELECT u.id, u.name, u.email, u.role, u.token_version, h.ash AS hash
                FROM users u
                JOIN hashes h ON h.id = u.id
                WHERE u.email = ?
                LIMIT 1
            ");
            $stmt->execute([$identifier]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($key, $user['hash'])) {
                throw new ExpiredException("Invalid email or password", 401);
            }

            unset($user['hash']);
            $user['tokenVersion'] = (int) $user['token_version'];
            unset($user['token_version']);

            $token = $this->manageCookies($user);
            $this->userLoad = $user;

            $this->consoleLog(['user' => $user, 'token' => $token]);
        } catch (ExpiredException $e) {
            $this->consoleLog($e->getMessage(), $e->getCode());
        } catch (Exception $e) {
            $this->consoleLog('An unexpected error occurred. Please try again.', 500);
        }
    }

    public function logOut(): void
    {
        if ($this->auth && isset($this->userLoad['id'])) {
            $db = Database::getInstance();
            $con = $db->connect();

            // Actual revocation, not just "stop sending the cookie" - bumping
            // this counter invalidates every token issued before it for this
            // account, including any other copies elsewhere.
            $con->prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?")
                ->execute([$this->userLoad['id']]);
        }

        $this->userLoad = [];
        $this->auth = false;
        $this->manageCookies();
    }
    // == AUTH == ✅

    // == FORGOT == ✅
    public function forgotPassword(string $email): void
    {
        $db  = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        $response = ['message' => 'If that email is registered, a reset code has been sent.'];

        // Same response whether or not the email is registered, so this
        // endpoint can't be used to enumerate accounts.
        if ($user) {
            $code = (string) random_int(100000, 999999);
            $tokenHash = hash('sha256', $code);

            $con->prepare("DELETE FROM password_resets WHERE user_id = ?")->execute([$user['id']]);

            $id = $this->generateUniqueId($con, 'pr_', 'password_resets');

            $con->prepare("
                INSERT INTO password_resets (id, user_id, token_hash, expires_at)
                VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
            ")->execute([$id, $user['id'], $tokenHash]);

            // config/mail.php still has placeholder Gmail credentials, so this
            // attempt will fail until real ones are dropped in - devCode below
            // is the fallback so testing isn't blocked on SMTP being configured.
            try {
                $this->sendmail([
                    'toEmail' => $email,
                    'subject' => 'Your Marila password reset code',
                    'body' => "Your password reset code is: $code\n\nIt expires in 15 minutes.",
                ]);
            } catch (\Throwable $th) {
                error_log('sendmail failed: ' . $th->getMessage());
            }

            $response['devCode'] = $code;
        }

        $this->consoleLog($response);
    }

    // Retries on port 465 (SMTPS) if 587 (STARTTLS) fails, since some
    // networks/ISPs block one or the other.
    private function sendmail(array $params): bool
    {
        $keys = include_once _DIR_(1) . '/config/mail.php';

        $smtpAttempts = [
            [587, PHPMailer::ENCRYPTION_STARTTLS],
            [465, PHPMailer::ENCRYPTION_SMTPS],
        ];

        $fromName = $params['fromName'] ?? 'no-reply';
        $toName = $params['toName'] ?? '';

        foreach ($smtpAttempts as [$port, $encryption]) {
            $mailer = new PHPMailer(true);
            try {
                $mailer->SMTPDebug = SMTP::DEBUG_OFF;
                $mailer->isSMTP();
                $mailer->Host = 'smtp.gmail.com';
                $mailer->SMTPAuth = true;
                $mailer->Username = $keys['username'];
                $mailer->Password = $keys['password'];
                $mailer->SMTPSecure = $encryption;
                $mailer->Port = $port;

                $mailer->setFrom($keys['username'], $fromName);
                $mailer->addAddress($params['toEmail'], $toName);

                $mailer->Subject = $params['subject'];
                $mailer->Body = $params['body'];

                if ($mailer->send()) {
                    return true;
                }
            } catch (PHPMailerException $e) {
                if ($port === 465) {
                    error_log('sendmail failed on both ports: ' . $e->getMessage());
                    return false;
                }
                // fall through to the next port
            }
        }

        return false;
    }

    public function resetPassword(string $email, string $code, string $newPassword): void
    {
        $db  = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            $this->consoleLog(['error' => 'Invalid or expired code'], 401);
        }

        $tokenHash = hash('sha256', $code);

        $stmt = $con->prepare("
            SELECT id FROM password_resets
            WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()
        ");
        $stmt->execute([$user['id'], $tokenHash]);
        $reset = $stmt->fetch();

        if (!$reset) {
            $this->consoleLog(['error' => 'Invalid or expired code'], 401);
        }

        $con->prepare("
            INSERT INTO hashes (id, ash) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE ash = VALUES(ash)
        ")->execute([$user['id'], password_hash($newPassword, PASSWORD_DEFAULT)]);

        $con->prepare("DELETE FROM password_resets WHERE id = ?")->execute([$reset['id']]);

        $this->consoleLog(['message' => 'Password reset successfully']);
    }
    // == FORGOT == ✅

    // === SYSTEM === ✅
    public function ping(): void
    {
        $this->consoleLog($this->auth ? [
            'status' => 'in',
            'timestamp' => time(),
            'message' => 'pong',
            'user' => $this->userLoad
        ] : [
            'status' => 'out',
            'timestamp' => time(),
            'message' => 'pong'
        ]);
    }
    // === SYSTEM === ✅

    // == USER / PROFILE ==
    public function addUser(array $data): void
    {
        $email = isset($data['email']) ? trim(preg_replace('/\s+/', ' ', $data['email'])) : '';
        $name  = isset($data['name']) ? trim(preg_replace('/\s+/', ' ', $data['name'])) : null;
        $password = $data['password'] ?? '';

        $required = ['email', 'password'];
        if (!$this->check_required_fields($required, ['email' => $email, 'password' => $password])) return;

        try {
            $db = Database::getInstance();
            $con = $db->connect();

            $id = $this->generateUniqueId($con, 'cust_', 'users');

            $con->beginTransaction();

            $con->prepare("
                INSERT INTO users (id, email, name, role, active)
                VALUES (?, ?, ?, 'customer', 'active')
            ")->execute([$id, $email, $name]);

            $con->prepare("
                INSERT INTO hashes (id, ash) VALUES (?, ?)
            ")->execute([$id, password_hash($password, PASSWORD_DEFAULT)]);

            $con->commit();

            $user = ['id' => $id, 'name' => $name, 'email' => $email, 'role' => 'customer', 'tokenVersion' => 0]; // fresh row, column default
            $token = $this->manageCookies($user);
            $this->userLoad = $user;

            $this->consoleLog(['user' => $user, 'token' => $token], 201);
        } catch (PDOException $e) {
            if (isset($con) && $con->inTransaction()) $con->rollBack();

            if ((int) $e->getCode() === 45001 || $e->getCode() === '23000') {
                $this->consoleLog(['error' => 'Email already in use'], 409);
            }

            $this->consoleLog(['error' => 'Could not create account'], 500);
        }
    }

    public function fetchProfile(): void
    {
        $this->requireAuth();

        $db  = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        $stmt->execute([$this->userLoad['id']]);

        $this->consoleLog($stmt->fetch(PDO::FETCH_ASSOC));
    }

    // Email is immutable once an account exists (it's the login identifier
    // and password-reset destination) - only name can be changed here.
    public function updateProfile(array $data): void
    {
        $this->requireAuth();

        $id = $this->userLoad['id'];

        $name = isset($data['name']) ? trim(preg_replace('/\s+/', ' ', $data['name'])) : null;

        if ($name !== null) {
            $db  = Database::getInstance();
            $con = $db->connect();

            $con->prepare("UPDATE users SET name = ? WHERE id = ?")->execute([$name, $id]);
        }

        $this->consoleLog(['id' => $id, 'updated' => true]);
    }

    public function changePassword(string $currentPassword, string $newPassword): void
    {
        $this->requireAuth();

        $id = $this->userLoad['id'];

        $db  = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("SELECT ash FROM hashes WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($currentPassword, $row['ash'])) {
            $this->consoleLog(['error' => 'Current password is incorrect'], 401);
        }

        $con->prepare("
            INSERT INTO hashes (id, ash) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE ash = VALUES(ash)
        ")->execute([$id, password_hash($newPassword, PASSWORD_DEFAULT)]);

        // A leaked-but-not-yet-used token shouldn't survive a password change.
        $con->prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?")
            ->execute([$id]);

        $this->consoleLog(['id' => $id, 'updated' => true]);
    }
    // == USER / PROFILE ==

    // == PRODUCTS ==
    public function fetchProduct(?string $id = null, array $filters = []): void
    {
        $db  = Database::getInstance();
        $con = $db->connect();

        if ($id) {
            $stmt = $con->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $this->consoleLog(['error' => 'Product not found'], 404);
            }

            $this->consoleLog($this->mapProductRow($con, $row));
        }

        $sql = "SELECT * FROM products WHERE 1 = 1";
        $params = [];

        if (!empty($filters['category']) && $filters['category'] !== 'All') {
            $sql .= " AND category = ?";
            $params[] = $filters['category'];
        }
        if (!empty($filters['collectionId'])) {
            $sql .= " AND collection_id = ?";
            $params[] = $filters['collectionId'];
        }

        $sql .= match ($filters['sort'] ?? '') {
            'price-low' => " ORDER BY price ASC",
            'price-high' => " ORDER BY price DESC",
            default => " ORDER BY created_at DESC",
        };

        $stmt = $con->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $products = array_map(fn($row) => $this->mapProductRow($con, $row), $rows);

        $this->consoleLog($products);
    }

    public function addProduct(array $product): void
    {
        $this->requireAuth(['admin', 'staff']);

        $name = isset($product['name']) ? trim(preg_replace('/\s+/', ' ', $product['name'])) : '';
        $price = isset($product['price']) ? floatval($product['price']) : 0;
        $category = isset($product['category']) ? trim(preg_replace('/\s+/', ' ', $product['category'])) : '';
        $description = trim($product['description'] ?? '');
        $inStock = isset($product['inStock']) ? boolval($product['inStock']) : true;
        $collectionId = $product['collectionId'] ?? null;

        $required = ['name' => $name, 'price' => $price, 'category' => $category];
        if (!$this->check_required_fields(['name', 'price', 'category'], $required)) return;

        try {
            $db = Database::getInstance();
            $con = $db->connect();

            $id = $this->generateUniqueId($con, 'prod_', 'products');

            $this->dbInsert($con, 'products', [
                'id' => $id,
                'name' => $name,
                'price' => $price,
                'category' => $category,
                'description' => $description,
                'in_stock' => $inStock ? 1 : 0,
                'collection_id' => $collectionId,
            ]);

            $this->saveProductVariants($con, $id, $product);

            $this->consoleLog($this->mapProductRow($con, ['id' => $id, 'name' => $name, 'price' => $price, 'category' => $category, 'description' => $description, 'in_stock' => $inStock, 'collection_id' => $collectionId]), 201);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 45003) {
                $this->consoleLog(['error' => 'A product with that name already exists'], 409);
            }
            $this->consoleLog(['error' => 'Could not create product'], 500);
        }
    }

    public function updateProduct(array $product): void
    {
        $this->requireAuth(['admin', 'staff']);

        $id = trim($product['id'] ?? '');
        if (!$this->check_required_fields(['id'], ['id' => $id])) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $fields = array_filter([
            'name' => isset($product['name']) ? trim(preg_replace('/\s+/', ' ', $product['name'])) : null,
            'price' => isset($product['price']) ? floatval($product['price']) : null,
            'category' => isset($product['category']) ? trim(preg_replace('/\s+/', ' ', $product['category'])) : null,
            'description' => isset($product['description']) ? trim($product['description']) : null,
            'in_stock' => isset($product['inStock']) ? (boolval($product['inStock']) ? 1 : 0) : null,
            'collection_id' => $product['collectionId'] ?? null,
        ], fn($v) => $v !== null);

        try {
            if ($fields) {
                $this->dbUpdate($con, 'products', ['id' => $id], $fields);
            }

            if (isset($product['sizes']) || isset($product['colors']) || isset($product['tags']) || isset($product['images'])) {
                $this->saveProductVariants($con, $id, $product, true);
            }

            $stmt = $con->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $this->consoleLog(['error' => 'Product not found'], 404);
            }

            $this->consoleLog($this->mapProductRow($con, $row));
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 45003) {
                $this->consoleLog(['error' => 'A product with that name already exists'], 409);
            }
            $this->consoleLog(['error' => 'Could not update product'], 500);
        }
    }

    private function saveProductVariants(PDO $con, string $id, array $product, bool $replace = false): void
    {
        $variantTables = [
            'images' => ['table' => 'product_images', 'col' => 'image'],
            'sizes' => ['table' => 'product_sizes', 'col' => 'size'],
            'colors' => ['table' => 'product_colors', 'col' => 'color'],
        ];

        foreach ($variantTables as $key => $meta) {
            if (!isset($product[$key])) continue;

            if ($replace) {
                $this->dbDelete($con, $meta['table'], ['product_id' => $id]);
            }

            foreach ((array) $product[$key] as $position => $value) {
                $value = trim((string) $value);
                if ($value === '') continue;

                $this->dbInsert($con, $meta['table'], [
                    'product_id' => $id,
                    $meta['col'] => $value,
                    'position' => $position,
                ]);
            }
        }

        if (isset($product['tags'])) {
            if ($replace) {
                $this->dbDelete($con, 'product_tags', ['product_id' => $id]);
            }
            foreach ((array) $product['tags'] as $tag) {
                $tag = trim((string) $tag);
                if ($tag === '') continue;
                $this->dbInsert($con, 'product_tags', ['product_id' => $id, 'tag' => $tag]);
            }
        }
    }

    // Shared by collections/articles - both just have a flat ordered image
    // gallery table (collection_images / article_images) keyed by parent id.
    private function saveGalleryImages(PDO $con, string $table, string $fkCol, string $id, array $images, bool $replace = false): void
    {
        if ($replace) {
            $this->dbDelete($con, $table, [$fkCol => $id]);
        }

        foreach ($images as $position => $image) {
            $image = trim((string) $image);
            if ($image === '') continue;

            $this->dbInsert($con, $table, [$fkCol => $id, 'image' => $image, 'position' => $position]);
        }
    }

    public function deleteProduct(string $id): void
    {
        $this->requireAuth(['admin', 'staff']);

        $db = Database::getInstance();
        $con = $db->connect();

        $deleted = $this->dbDelete($con, 'products', ['id' => $id]);

        $this->consoleLog(['id' => $id, 'deleted' => $deleted]);
    }
    // == PRODUCTS ==

    // == COLLECTIONS ==
    private function mapCollectionRow(PDO $con, array $row): array
    {
        $images = $con->prepare("SELECT image FROM collection_images WHERE collection_id = ? ORDER BY position");
        $images->execute([$row['id']]);

        $products = $con->prepare("SELECT id FROM products WHERE collection_id = ?");
        $products->execute([$row['id']]);

        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'season' => $row['season'],
            'year' => $row['year'],
            'coverImage' => $row['cover_image'],
            'images' => $images->fetchAll(PDO::FETCH_COLUMN),
            'story' => $row['story'],
            'productIds' => $products->fetchAll(PDO::FETCH_COLUMN),
        ];
    }

    public function fetchCollection(?string $id = null): void
    {
        $db  = Database::getInstance();
        $con = $db->connect();

        if ($id) {
            $stmt = $con->prepare("SELECT * FROM collections WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $this->consoleLog(['error' => 'Collection not found'], 404);
            }

            $this->consoleLog($this->mapCollectionRow($con, $row));
        }

        $stmt = $con->query("SELECT * FROM collections ORDER BY year DESC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->consoleLog(array_map(fn($row) => $this->mapCollectionRow($con, $row), $rows));
    }

    public function addCollection(array $data): void
    {
        $this->requireAuth(['admin', 'staff']);

        $fields = [
            'name' => trim($data['name'] ?? ''),
            'description' => trim($data['description'] ?? ''),
            'season' => trim($data['season'] ?? ''),
            'year' => trim($data['year'] ?? ''),
            'cover_image' => trim($data['coverImage'] ?? ''),
            'story' => trim($data['story'] ?? ''),
        ];

        if (!$this->check_required_fields(array_keys($fields), $fields)) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $id = $this->generateUniqueId($con, 'col_', 'collections');

        $this->dbInsert($con, 'collections', ['id' => $id, ...$fields]);
        $this->saveGalleryImages($con, 'collection_images', 'collection_id', $id, $data['images'] ?? []);

        $stmt = $con->prepare("SELECT * FROM collections WHERE id = ?");
        $stmt->execute([$id]);

        $this->consoleLog($this->mapCollectionRow($con, $stmt->fetch(PDO::FETCH_ASSOC)), 201);
    }

    public function updateCollection(array $data): void
    {
        $this->requireAuth(['admin', 'staff']);

        $id = trim($data['id'] ?? '');
        if (!$this->check_required_fields(['id'], ['id' => $id])) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $fields = array_filter([
            'name' => isset($data['name']) ? trim($data['name']) : null,
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'season' => isset($data['season']) ? trim($data['season']) : null,
            'year' => isset($data['year']) ? trim($data['year']) : null,
            'cover_image' => isset($data['coverImage']) ? trim($data['coverImage']) : null,
            'story' => isset($data['story']) ? trim($data['story']) : null,
        ], fn($v) => $v !== null);

        if ($fields) {
            $this->dbUpdate($con, 'collections', ['id' => $id], $fields);
        }

        if (isset($data['images'])) {
            $this->saveGalleryImages($con, 'collection_images', 'collection_id', $id, $data['images'], true);
        }

        $stmt = $con->prepare("SELECT * FROM collections WHERE id = ?");
        $stmt->execute([$id]);

        $this->consoleLog($this->mapCollectionRow($con, $stmt->fetch(PDO::FETCH_ASSOC)));
    }

    public function deleteCollection(string $id): void
    {
        $this->requireAuth(['admin', 'staff']);

        $db = Database::getInstance();
        $con = $db->connect();

        $deleted = $this->dbDelete($con, 'collections', ['id' => $id]);

        $this->consoleLog(['id' => $id, 'deleted' => $deleted]);
    }
    // == COLLECTIONS ==

    // == ARTICLES ==
    private function mapArticleRow(PDO $con, array $row): array
    {
        $images = $con->prepare("SELECT image FROM article_images WHERE article_id = ? ORDER BY position");
        $images->execute([$row['id']]);

        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'excerpt' => $row['excerpt'],
            'content' => $row['content'],
            'author' => $row['author'],
            'date' => $row['date'],
            'category' => $row['category'],
            'coverImage' => $row['cover_image'],
            'images' => $images->fetchAll(PDO::FETCH_COLUMN),
        ];
    }

    public function fetchArticle(?string $id = null): void
    {
        $db  = Database::getInstance();
        $con = $db->connect();

        if ($id) {
            $stmt = $con->prepare("SELECT * FROM articles WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $this->consoleLog(['error' => 'Article not found'], 404);
            }

            $this->consoleLog($this->mapArticleRow($con, $row));
        }

        $stmt = $con->query("SELECT * FROM articles ORDER BY date DESC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->consoleLog(array_map(fn($row) => $this->mapArticleRow($con, $row), $rows));
    }

    public function addArticle(array $data): void
    {
        $this->requireAuth(['admin', 'staff']);

        $fields = [
            'title' => trim($data['title'] ?? ''),
            'excerpt' => trim($data['excerpt'] ?? ''),
            'content' => trim($data['content'] ?? ''),
            'author' => trim($data['author'] ?? ''),
            'date' => trim($data['date'] ?? date('Y-m-d')),
            'category' => trim($data['category'] ?? ''),
            'cover_image' => trim($data['coverImage'] ?? ''),
        ];

        if (!$this->check_required_fields(['title', 'excerpt', 'content', 'author', 'category', 'cover_image'], $fields)) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $id = $this->generateUniqueId($con, 'art_', 'articles');

        $this->dbInsert($con, 'articles', ['id' => $id, ...$fields]);
        $this->saveGalleryImages($con, 'article_images', 'article_id', $id, $data['images'] ?? []);

        $stmt = $con->prepare("SELECT * FROM articles WHERE id = ?");
        $stmt->execute([$id]);

        $this->consoleLog($this->mapArticleRow($con, $stmt->fetch(PDO::FETCH_ASSOC)), 201);
    }

    public function updateArticle(array $data): void
    {
        $this->requireAuth(['admin', 'staff']);

        $id = trim($data['id'] ?? '');
        if (!$this->check_required_fields(['id'], ['id' => $id])) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $fields = array_filter([
            'title' => isset($data['title']) ? trim($data['title']) : null,
            'excerpt' => isset($data['excerpt']) ? trim($data['excerpt']) : null,
            'content' => isset($data['content']) ? trim($data['content']) : null,
            'author' => isset($data['author']) ? trim($data['author']) : null,
            'date' => isset($data['date']) ? trim($data['date']) : null,
            'category' => isset($data['category']) ? trim($data['category']) : null,
            'cover_image' => isset($data['coverImage']) ? trim($data['coverImage']) : null,
        ], fn($v) => $v !== null);

        if ($fields) {
            $this->dbUpdate($con, 'articles', ['id' => $id], $fields);
        }

        if (isset($data['images'])) {
            $this->saveGalleryImages($con, 'article_images', 'article_id', $id, $data['images'], true);
        }

        $stmt = $con->prepare("SELECT * FROM articles WHERE id = ?");
        $stmt->execute([$id]);

        $this->consoleLog($this->mapArticleRow($con, $stmt->fetch(PDO::FETCH_ASSOC)));
    }

    public function deleteArticle(string $id): void
    {
        $this->requireAuth(['admin', 'staff']);

        $db = Database::getInstance();
        $con = $db->connect();

        $deleted = $this->dbDelete($con, 'articles', ['id' => $id]);

        $this->consoleLog(['id' => $id, 'deleted' => $deleted]);
    }
    // == ARTICLES ==

    // == LOCATIONS ==
    public function fetchLocations(): void
    {
        $db  = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->query("SELECT id, name, address, city, hours, phone FROM locations ORDER BY name");

        $this->consoleLog($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function addLocation(array $data): void
    {
        $this->requireAuth(['admin', 'staff']);

        $fields = [
            'name' => trim($data['name'] ?? ''),
            'address' => trim($data['address'] ?? ''),
            'city' => trim($data['city'] ?? ''),
            'hours' => trim($data['hours'] ?? ''),
            'phone' => trim($data['phone'] ?? ''),
        ];

        if (!$this->check_required_fields(array_keys($fields), $fields)) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $id = $this->generateUniqueId($con, 'loc_', 'locations');

        $this->dbInsert($con, 'locations', ['id' => $id, ...$fields]);

        $this->consoleLog(['id' => $id, ...$fields], 201);
    }

    public function updateLocation(array $data): void
    {
        $this->requireAuth(['admin', 'staff']);

        $id = trim($data['id'] ?? '');
        if (!$this->check_required_fields(['id'], ['id' => $id])) return;

        $fields = array_filter([
            'name' => isset($data['name']) ? trim($data['name']) : null,
            'address' => isset($data['address']) ? trim($data['address']) : null,
            'city' => isset($data['city']) ? trim($data['city']) : null,
            'hours' => isset($data['hours']) ? trim($data['hours']) : null,
            'phone' => isset($data['phone']) ? trim($data['phone']) : null,
        ], fn($v) => $v !== null);

        $db = Database::getInstance();
        $con = $db->connect();

        $updated = $fields ? $this->dbUpdate($con, 'locations', ['id' => $id], $fields) : false;

        $this->consoleLog(['id' => $id, 'updated' => $updated]);
    }

    public function deleteLocation(string $id): void
    {
        $this->requireAuth(['admin', 'staff']);

        $db = Database::getInstance();
        $con = $db->connect();

        $deleted = $this->dbDelete($con, 'locations', ['id' => $id]);

        $this->consoleLog(['id' => $id, 'deleted' => $deleted]);
    }
    // == LOCATIONS ==

    // == CATEGORIES ==
    public function fetchCategories(): void
    {
        $db = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->query("SELECT name FROM categories ORDER BY name");

        $this->consoleLog($stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function addCategory(string $name): void
    {
        $this->requireAuth(['admin', 'staff']);

        $name = trim($name);
        if (!$this->check_required_fields(['name'], ['name' => $name])) return;

        $db = Database::getInstance();
        $con = $db->connect();

        try {
            $this->dbInsert($con, 'categories', ['name' => $name]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000 || $e->getCode() === '23000') {
                $this->consoleLog(['error' => 'That category already exists'], 409);
            }
            throw $e;
        }

        $this->consoleLog(['name' => $name], 201);
    }

    public function deleteCategory(string $name): void
    {
        $this->requireAuth(['admin', 'staff']);

        $db = Database::getInstance();
        $con = $db->connect();

        try {
            $deleted = $this->dbDelete($con, 'categories', ['name' => $name]);
            $this->consoleLog(['name' => $name, 'deleted' => $deleted]);
        } catch (PDOException $e) {
            $this->consoleLog(['error' => 'Category is still in use by one or more products'], 409);
        }
    }
    // == CATEGORIES ==

    // == SITE SETTINGS ==
    public function fetchSettings(): void
    {
        $db = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->query("SELECT name, tagline, logo, instagram, twitter, pinterest FROM site_settings WHERE id = 1");

        $this->consoleLog($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function updateSettings(array $data): void
    {
        $this->requireAuth(['admin']);

        $fields = array_filter([
            'name' => isset($data['name']) ? trim($data['name']) : null,
            'tagline' => isset($data['tagline']) ? trim($data['tagline']) : null,
            'logo' => isset($data['logo']) ? trim($data['logo']) : null,
            'instagram' => isset($data['instagram']) ? trim($data['instagram']) : null,
            'twitter' => isset($data['twitter']) ? trim($data['twitter']) : null,
            'pinterest' => isset($data['pinterest']) ? trim($data['pinterest']) : null,
        ], fn($v) => $v !== null);

        if ($fields) {
            $db = Database::getInstance();
            $con = $db->connect();
            $this->dbUpdate($con, 'site_settings', ['id' => 1], $fields);
        }

        $this->consoleLog(['updated' => true]);
    }
    // == SITE SETTINGS ==

    // == STAFF ==
    public function fetchStaff(): void
    {
        $this->requireAuth(['admin']);

        $db = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->query("
            SELECT id, name, email, role, active
            FROM users
            WHERE role IN ('admin', 'staff')
            ORDER BY email
        ");

        $this->consoleLog($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function addStaff(array $data): void
    {
        $this->requireAuth(['admin']);

        $email = trim($data['email'] ?? '');
        $name = isset($data['name']) ? trim($data['name']) : null;
        $password = $data['password'] ?? '';
        $role = ($data['role'] ?? 'staff') === 'admin' ? 'admin' : 'staff';

        if (!$this->check_required_fields(['email', 'password'], ['email' => $email, 'password' => $password])) return;

        try {
            $db = Database::getInstance();
            $con = $db->connect();

            $id = $this->generateUniqueId($con, 'staff_', 'users');

            $con->beginTransaction();

            $con->prepare("
                INSERT INTO users (id, email, name, role, active)
                VALUES (?, ?, ?, ?, 'active')
            ")->execute([$id, $email, $name, $role]);

            $con->prepare("INSERT INTO hashes (id, ash) VALUES (?, ?)")
                ->execute([$id, password_hash($password, PASSWORD_DEFAULT)]);

            $con->commit();

            $this->consoleLog(['id' => $id, 'email' => $email, 'role' => $role], 201);
        } catch (PDOException $e) {
            if (isset($con) && $con->inTransaction()) $con->rollBack();

            if ((int) $e->getCode() === 45001 || $e->getCode() === '23000') {
                $this->consoleLog(['error' => 'Email already in use'], 409);
            }
            $this->consoleLog(['error' => 'Could not create account'], 500);
        }
    }

    public function deleteStaff(string $id): void
    {
        $this->requireAuth(['admin']);

        $db = Database::getInstance();
        $con = $db->connect();

        $updated = $this->dbUpdate($con, 'users', ['id' => $id], ['active' => 'inactive']);

        $this->consoleLog(['id' => $id, 'deactivated' => $updated]);
    }
    // == STAFF ==

    // == UPLOAD ==
    public function uploadImage(string $folder): void
    {
        $this->requireAuth(['admin', 'staff']);

        $allowedFolders = ['products', 'collections', 'articles', 'site'];
        if (!in_array($folder, $allowedFolders, true)) {
            $this->consoleLog(['error' => 'Invalid folder'], 400);
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $this->consoleLog(['error' => 'No image uploaded or upload error'], 400);
        }

        $file = $_FILES['image'];

        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $mime = mime_content_type($file['tmp_name']);
        if (!in_array($mime, $allowedTypes, true)) {
            $this->consoleLog(['error' => 'Invalid file type'], 400);
        }

        $maxSize = 5 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            $this->consoleLog(['error' => 'File too large (5MB max)'], 400);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;

        $uploadDir = __DIR__ . "/uploads/$folder/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destination = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            $this->consoleLog(['error' => 'Failed to save image'], 500);
        }

        $prefix = include_once _DIR_(1) . '/config/uploads.php';
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];

        $this->consoleLog(['url' => "$scheme://$host{$prefix}$folder/$filename"], 201);
    }
    // == UPLOAD ==

    // == CART ==
    public function fetchCart(): void
    {
        $this->requireAuth();

        $db  = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("
            SELECT product_id AS productId, size, color, quantity
            FROM cart_items
            WHERE cart_id = ?
        ");
        $stmt->execute([$this->userLoad['id']]);

        $this->consoleLog($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function addToCart(array $item): void
    {
        $this->requireAuth();

        $cartId = $this->userLoad['id'];
        $productId = trim($item['productId'] ?? '');
        $size = trim($item['size'] ?? '');
        $color = trim($item['color'] ?? '');
        $quantity = (int) ($item['quantity'] ?? 0);

        if (!$this->check_required_fields(
            ['productId', 'size', 'color'],
            ['productId' => $productId, 'size' => $size, 'color' => $color]
        )) return;

        if ($quantity < 1) {
            $this->consoleLog(['error' => 'quantity must be at least 1'], 400);
        }

        $db = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("
            INSERT INTO cart_items (cart_id, product_id, size, color, quantity)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        ");
        $stmt->execute([$cartId, $productId, $size, $color, $quantity]);

        $this->consoleLog(['productId' => $productId, 'size' => $size, 'color' => $color, 'quantity' => $quantity]);
    }

    public function updateCartItem(array $item): void
    {
        $this->requireAuth();

        $cartId = $this->userLoad['id'];
        $productId = trim($item['productId'] ?? '');
        $size = trim($item['size'] ?? '');
        $color = trim($item['color'] ?? '');
        $quantity = (int) ($item['quantity'] ?? 0);

        if (!$this->check_required_fields(
            ['productId', 'size', 'color'],
            ['productId' => $productId, 'size' => $size, 'color' => $color]
        )) return;

        $db = Database::getInstance();
        $con = $db->connect();

        if ($quantity < 1) {
            $deleted = $this->dbDelete($con, 'cart_items', [
                'cart_id' => $cartId, 'product_id' => $productId, 'size' => $size, 'color' => $color
            ]);
            $this->consoleLog(['productId' => $productId, 'removed' => $deleted]);
        }

        $updated = $this->dbUpdate(
            $con,
            'cart_items',
            ['cart_id' => $cartId, 'product_id' => $productId, 'size' => $size, 'color' => $color],
            ['quantity' => $quantity]
        );

        $this->consoleLog(['productId' => $productId, 'quantity' => $quantity, 'updated' => $updated]);
    }

    public function removeFromCart(array $item): void
    {
        $this->requireAuth();

        $cartId = $this->userLoad['id'];
        $productId = trim($item['productId'] ?? '');

        $db = Database::getInstance();
        $con = $db->connect();

        // No productId clears the whole cart (used by "place order" / "empty cart").
        if (!$productId) {
            $this->dbDelete($con, 'cart_items', ['cart_id' => $cartId]);
            $this->consoleLog(['cleared' => true]);
        }

        $searchBy = ['cart_id' => $cartId, 'product_id' => $productId];
        if (!empty($item['size'])) $searchBy['size'] = trim($item['size']);
        if (!empty($item['color'])) $searchBy['color'] = trim($item['color']);

        $deleted = $this->dbDelete($con, 'cart_items', $searchBy);

        $this->consoleLog(['productId' => $productId, 'removed' => $deleted]);
    }
    // == CART ==

    // == WISHLIST ==
    public function fetchWishlist(): void
    {
        $this->requireAuth();

        $db = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("SELECT product_id FROM wishlist_items WHERE user_id = ?");
        $stmt->execute([$this->userLoad['id']]);

        $this->consoleLog($stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function addWishlist(string $productId): void
    {
        $this->requireAuth();

        $productId = trim($productId);
        if (!$this->check_required_fields(['productId'], ['productId' => $productId])) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("
            INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)
        ");
        $stmt->execute([$this->userLoad['id'], $productId]);

        $this->consoleLog(['productId' => $productId, 'added' => true]);
    }

    public function removeWishlist(string $productId): void
    {
        $this->requireAuth();

        $db = Database::getInstance();
        $con = $db->connect();

        $deleted = $this->dbDelete($con, 'wishlist_items', [
            'user_id' => $this->userLoad['id'],
            'product_id' => trim($productId),
        ]);

        $this->consoleLog(['productId' => $productId, 'removed' => $deleted]);
    }
    // == WISHLIST ==

    // == ADDRESSES ==
    public function fetchAddresses(): void
    {
        $this->requireAuth();

        $db  = Database::getInstance();
        $con = $db->connect();

        $stmt = $con->prepare("
            SELECT id, name, street, city, state, zip, country, is_default AS isDefault
            FROM addresses
            WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
        ");
        $stmt->execute([$this->userLoad['id']]);

        $rows = array_map(function ($row) {
            $row['isDefault'] = (bool) $row['isDefault'];
            return $row;
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));

        $this->consoleLog($rows);
    }

    public function addAddress(array $data): void
    {
        $this->requireAuth();

        $required = ['name', 'street', 'city', 'state', 'zip', 'country'];
        $fields = [];
        foreach ($required as $field) {
            $fields[$field] = isset($data[$field]) ? trim(preg_replace('/\s+/', ' ', $data[$field])) : '';
        }
        if (!$this->check_required_fields($required, $fields)) return;

        $userId = $this->userLoad['id'];
        $isDefault = !empty($data['isDefault']);

        $db = Database::getInstance();
        $con = $db->connect();

        $id = $this->generateUniqueId($con, 'addr_', 'addresses');

        if ($isDefault) {
            $this->dbUpdate($con, 'addresses', ['user_id' => $userId], ['is_default' => 0]);
        }

        $this->dbInsert($con, 'addresses', [
            'id' => $id,
            'user_id' => $userId,
            ...$fields,
            'is_default' => $isDefault ? 1 : 0,
        ]);

        $this->consoleLog(['id' => $id, ...$fields, 'isDefault' => $isDefault], 201);
    }

    public function updateAddress(array $data): void
    {
        $this->requireAuth();

        $id = trim($data['id'] ?? '');
        if (!$this->check_required_fields(['id'], ['id' => $id])) return;

        $userId = $this->userLoad['id'];

        $fields = array_filter([
            'name' => isset($data['name']) ? trim($data['name']) : null,
            'street' => isset($data['street']) ? trim($data['street']) : null,
            'city' => isset($data['city']) ? trim($data['city']) : null,
            'state' => isset($data['state']) ? trim($data['state']) : null,
            'zip' => isset($data['zip']) ? trim($data['zip']) : null,
            'country' => isset($data['country']) ? trim($data['country']) : null,
        ], fn($v) => $v !== null);

        $db = Database::getInstance();
        $con = $db->connect();

        if (isset($data['isDefault'])) {
            if ($data['isDefault']) {
                $this->dbUpdate($con, 'addresses', ['user_id' => $userId], ['is_default' => 0]);
            }
            $fields['is_default'] = $data['isDefault'] ? 1 : 0;
        }

        $updated = $fields ? $this->dbUpdate($con, 'addresses', ['id' => $id, 'user_id' => $userId], $fields) : false;

        $this->consoleLog(['id' => $id, 'updated' => $updated]);
    }

    public function deleteAddress(string $id): void
    {
        $this->requireAuth();

        $db = Database::getInstance();
        $con = $db->connect();

        $deleted = $this->dbDelete($con, 'addresses', ['id' => $id, 'user_id' => $this->userLoad['id']]);

        $this->consoleLog(['id' => $id, 'deleted' => $deleted]);
    }
    // == ADDRESSES ==

    // == ORDERS ==
    private function mapOrderRow(PDO $con, array $row): array
    {
        $items = $con->prepare("
            SELECT product_id AS productId, size, color, quantity
            FROM order_items
            WHERE order_id = ?
        ");
        $items->execute([$row['id']]);

        return [
            'id' => $row['id'],
            'userId' => $row['user_id'],
            'date' => $row['date'],
            'status' => $row['status'],
            'paymentStatus' => $row['payment_status'],
            'subtotal' => (float) $row['subtotal'],
            'shipping' => (float) $row['shipping_fee'],
            'tax' => (float) $row['tax'],
            'total' => (float) $row['total'],
            'items' => $items->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    public function addOrder(array $data): void
    {
        $this->requireAuth();

        $userId = $this->userLoad['id'];

        $db = Database::getInstance();
        $con = $db->connect();

        $cartStmt = $con->prepare("
            SELECT ci.product_id, ci.size, ci.color, ci.quantity, p.price
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = ?
        ");
        $cartStmt->execute([$userId]);
        $cartRows = $cartStmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$cartRows) {
            $this->consoleLog(['error' => 'Cart is empty'], 400);
        }

        $addressId = $data['addressId'] ?? null;
        if ($addressId) {
            $check = $con->prepare("SELECT id FROM addresses WHERE id = ? AND user_id = ?");
            $check->execute([$addressId, $userId]);
            if (!$check->fetch()) {
                $this->consoleLog(['error' => 'Address not found'], 404);
            }
        }

        // All monetary figures are computed server-side from current product
        // prices, never trusted from the client.
        $subtotal = array_reduce($cartRows, fn($sum, $row) => $sum + $row['price'] * $row['quantity'], 0.0);
        $shippingFee = 15.0;
        $tax = round($subtotal * 0.08, 2);
        $total = $subtotal + $shippingFee + $tax;

        try {
            $con->beginTransaction();

            $orderId = $this->generateUniqueId($con, 'ord_', 'orders');

            $this->dbInsert($con, 'orders', [
                'id' => $orderId,
                'user_id' => $userId,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'tax' => $tax,
                'total' => $total,
                'address_id' => $addressId,
            ]);

            foreach ($cartRows as $row) {
                $this->dbInsert($con, 'order_items', [
                    'order_id' => $orderId,
                    'product_id' => $row['product_id'],
                    'size' => $row['size'],
                    'color' => $row['color'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['price'],
                ]);
            }

            $this->dbDelete($con, 'cart_items', ['cart_id' => $userId]);

            $con->commit();

            $orderStmt = $con->prepare("SELECT * FROM orders WHERE id = ?");
            $orderStmt->execute([$orderId]);

            // No server-side Paystack call here - the frontend opens the
            // inline popup directly with this order's id as the payment
            // reference, then /payment/:reference verifies it afterwards.
            $this->consoleLog($this->mapOrderRow($con, $orderStmt->fetch(PDO::FETCH_ASSOC)), 201);
        } catch (\Throwable $th) {
            if ($con->inTransaction()) $con->rollBack();
            $this->consoleLog(['error' => $th->getMessage() ?: 'Could not place order'], 500);
        }
    }

    // == PAYMENT (Paystack) ==
    public function fetchPaystackKey(): void
    {
        $this->consoleLog(['key' => PAYSTACK_PUBLIC_KEY]);
    }

    public function paymentWebhook(string $input): void
    {
        $headers = getallheaders();
        $signature = $headers['x-paystack-signature'] ?? ($headers['X-Paystack-Signature'] ?? null);

        if (!$signature || hash_hmac('sha512', $input, PAYSTACK_SECRET_KEY) !== $signature) {
            http_response_code(400);
            exit('Invalid signature');
        }

        $event = json_decode($input, true);

        if (($event['event'] ?? null) === 'charge.success') {
            $reference = $event['data']['reference'] ?? null;

            if ($reference) {
                $db = Database::getInstance();
                $con = $db->connect();

                $status = $event['data']['status'] ?? null;

                switch ($status) {
                    case 'success':
                        $this->dbUpdate($con, 'orders', ['id' => $reference], ['payment_status' => 'success']);
                        break;
                    case 'failed':
                        $this->dbUpdate($con, 'orders', ['id' => $reference], ['payment_status' => 'failed']);
                        break;
                }
            }
        }

        http_response_code(200);
    }

    public function verifyPayment(string $reference): void
    {
        $this->requireAuth();

        if (!$reference) {
            $this->consoleLog(['error' => 'reference is required'], 400);
        }

        $db = Database::getInstance();
        $con = $db->connect();

        $isStaff = in_array($this->userLoad['role'] ?? null, ['admin', 'staff'], true);

        $owner = $this->fetchCol($con, 'orders', ['id' => $reference], ['user_id']);

        if (!$owner) {
            $this->consoleLog(['error' => 'Order not found'], 404);
        }

        if (!$isStaff && $owner !== $this->userLoad['id']) {
            $this->consoleLog(['error' => 'Forbidden'], 403);
        }

        $ch = curl_init("https://api.paystack.co/transaction/verify/$reference");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . PAYSTACK_SECRET_KEY]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->consoleLog(['error' => "Could not verify payment: $error"], 502);
        }

        $result = json_decode($response, true);
        $status = $result['data']['status'] ?? null;

        if (in_array($status, ['success', 'failed'], true)) {
            $this->dbUpdate($con, 'orders', ['id' => $reference], ['payment_status' => $status]);
        }

        $orderStmt = $con->prepare("SELECT * FROM orders WHERE id = ?");
        $orderStmt->execute([$reference]);

        $this->consoleLog([
            ...$this->mapOrderRow($con, $orderStmt->fetch(PDO::FETCH_ASSOC)),
            'gatewayStatus' => $status,
        ]);
    }

    private function fetchCol(PDO $pdo, string $table, array $where, array $col = ['id']): string
    {
        $whereClauses = array_map(fn($c) => "`$c` = ?", array_keys($where));
        $whereSQL = implode(' AND ', $whereClauses);
        $col = implode(', ', $col);

        $stmt = $pdo->prepare("SELECT $col FROM $table WHERE $whereSQL LIMIT 1");
        $stmt->execute(array_values($where));

        return (string) $stmt->fetchColumn();
    }
    // == PAYMENT (Paystack) ==

    public function fetchOrder(?string $id = null): void
    {
        $this->requireAuth();

        $db = Database::getInstance();
        $con = $db->connect();

        $isStaff = in_array($this->userLoad['role'] ?? null, ['admin', 'staff'], true);

        if ($id) {
            $sql = "SELECT * FROM orders WHERE id = ?";
            $params = [$id];
            if (!$isStaff) {
                $sql .= " AND user_id = ?";
                $params[] = $this->userLoad['id'];
            }

            $stmt = $con->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $this->consoleLog(['error' => 'Order not found'], 404);
            }

            $this->consoleLog($this->mapOrderRow($con, $row));
        }

        if ($isStaff) {
            $stmt = $con->query("SELECT * FROM orders ORDER BY created_at DESC");
        } else {
            $stmt = $con->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$this->userLoad['id']]);
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->consoleLog(array_map(fn($row) => $this->mapOrderRow($con, $row), $rows));
    }

    public function updateOrder(array $data): void
    {
        $this->requireAuth(['admin', 'staff']);

        $id = trim($data['id'] ?? '');
        $status = $data['status'] ?? null;

        if (!$this->check_required_fields(['id'], ['id' => $id])) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $updated = $status ? $this->dbUpdate($con, 'orders', ['id' => $id], ['status' => $status]) : false;

        $this->consoleLog(['id' => $id, 'updated' => $updated]);
    }
    // == ORDERS ==

    // == CHAT ==
    private const CHAT_CLAIM_STALE_MINUTES = 15;

    private function mapMessageRow(array $row): array
    {
        return [
            'id' => $row['id'],
            'conversationId' => $row['conversation_id'],
            'senderId' => $row['sender_id'],
            'senderRole' => $row['sender_role'],
            'body' => $row['body'],
            'createdAt' => $row['created_at'],
        ];
    }

    private function getOrCreateConversation(PDO $con, string $userId): array
    {
        $stmt = $con->prepare("SELECT * FROM conversations WHERE user_id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) return $row;

        $id = $this->generateUniqueId($con, 'conv_', 'conversations');
        $this->dbInsert($con, 'conversations', ['id' => $id, 'user_id' => $userId]);

        $stmt = $con->prepare("SELECT * FROM conversations WHERE id = ?");
        $stmt->execute([$id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // No cron exists in this codebase, so a claimed-but-abandoned conversation
    // (a customer message sitting unanswered past the stale window) is
    // released back to the queue lazily, right before the staff list is read.
    private function releaseStaleClaims(PDO $con): void
    {
        $minutes = self::CHAT_CLAIM_STALE_MINUTES;

        $con->exec("
            UPDATE conversations c
            SET claimed_by = NULL, claimed_at = NULL
            WHERE claimed_by IS NOT NULL
            AND (SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role = 'customer')
                > COALESCE(
                    (SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role IN ('staff', 'admin')),
                    c.claimed_at
                  )
            AND (SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role = 'customer')
                < NOW() - INTERVAL $minutes MINUTE
        ");
    }

    public function fetchConversation(?string $id = null, bool $markRead = true): void
    {
        $this->requireAuth();

        $db = Database::getInstance();
        $con = $db->connect();

        $isStaff = in_array($this->userLoad['role'] ?? null, ['admin', 'staff'], true);

        if ($id) {
            $stmt = $con->prepare("SELECT * FROM conversations WHERE id = ?");
            $stmt->execute([$id]);
            $conversation = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$conversation) {
                $this->consoleLog(['error' => 'Conversation not found'], 404);
            }

            if (!$isStaff && $conversation['user_id'] !== $this->userLoad['id']) {
                $this->consoleLog(['error' => 'Forbidden'], 403);
            }

            $messages = $con->prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at");
            $messages->execute([$id]);
            $rows = $messages->fetchAll(PDO::FETCH_ASSOC);

            if ($markRead) {
                // NOW(6) (DB clock, microsecond precision) - not PHP's date():
                // PHP and MySQL can run on different clocks/timezones, and this
                // value is compared directly against messages.created_at
                // (also DB-clock, same microsecond precision).
                $readCol = $isStaff ? 'staff_last_read_at' : 'customer_last_read_at';
                $con->prepare("UPDATE conversations SET `$readCol` = NOW(6) WHERE id = ?")->execute([$id]);
            }

            $this->consoleLog([
                'conversationId' => $id,
                'messages' => array_map([$this, 'mapMessageRow'], $rows),
            ]);
        }

        if ($isStaff) {
            $this->releaseStaleClaims($con);

            $summarySql = "
                SELECT c.id, c.user_id, u.name AS user_name, u.email AS user_email, c.claimed_by,
                  (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                  (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
                  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role = 'customer'
                     AND (c.staff_last_read_at IS NULL OR m.created_at > c.staff_last_read_at)) AS unread_count
                FROM conversations c
                JOIN users u ON u.id = c.user_id
                WHERE c.claimed_by %s
                ORDER BY last_message_at DESC
            ";

            $queueStmt = $con->query(sprintf($summarySql, 'IS NULL'));
            $queue = $queueStmt->fetchAll(PDO::FETCH_ASSOC);

            $mineStmt = $con->prepare(sprintf($summarySql, '= ?'));
            $mineStmt->execute([$this->userLoad['id']]);
            $mine = $mineStmt->fetchAll(PDO::FETCH_ASSOC);

            $map = fn($row) => [
                'id' => $row['id'],
                'userId' => $row['user_id'],
                'userName' => $row['user_name'],
                'userEmail' => $row['user_email'],
                'claimedBy' => $row['claimed_by'],
                'lastMessage' => $row['last_message'],
                'lastMessageAt' => $row['last_message_at'],
                'unreadCount' => (int) $row['unread_count'],
            ];

            $this->consoleLog([
                'queue' => array_map($map, $queue),
                'mine' => array_map($map, $mine),
            ]);
        }

        // Customer, no id: get-or-create their own conversation.
        $conversation = $this->getOrCreateConversation($con, $this->userLoad['id']);

        $unreadStmt = $con->prepare("
            SELECT COUNT(*) FROM messages
            WHERE conversation_id = ? AND sender_role IN ('staff', 'admin')
            AND created_at > COALESCE(?, '1970-01-01')
        ");
        $unreadStmt->execute([$conversation['id'], $conversation['customer_last_read_at']]);
        $unreadCount = (int) $unreadStmt->fetchColumn();

        $messages = $con->prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at");
        $messages->execute([$conversation['id']]);
        $rows = $messages->fetchAll(PDO::FETCH_ASSOC);

        if ($markRead) {
            $con->prepare("UPDATE conversations SET customer_last_read_at = NOW(6) WHERE id = ?")
                ->execute([$conversation['id']]);
        }

        $this->consoleLog([
            'conversationId' => $conversation['id'],
            'unreadCount' => $unreadCount,
            'messages' => array_map([$this, 'mapMessageRow'], $rows),
        ]);
    }

    public function postMessage(array $data): void
    {
        $this->requireAuth();

        $body = trim($data['body'] ?? '');
        if (!$this->check_required_fields(['body'], ['body' => $body])) return;

        $db = Database::getInstance();
        $con = $db->connect();

        $isStaff = in_array($this->userLoad['role'] ?? null, ['admin', 'staff'], true);
        $isAdmin = ($this->userLoad['role'] ?? null) === 'admin';

        if ($isStaff) {
            $conversationId = trim($data['conversationId'] ?? '');
            if (!$this->check_required_fields(['conversationId'], ['conversationId' => $conversationId])) return;

            $stmt = $con->prepare("SELECT * FROM conversations WHERE id = ?");
            $stmt->execute([$conversationId]);
            $conversation = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$conversation) {
                $this->consoleLog(['error' => 'Conversation not found'], 404);
            }

            if ($conversation['claimed_by'] && $conversation['claimed_by'] !== $this->userLoad['id'] && !$isAdmin) {
                $this->consoleLog(['error' => 'Conversation is claimed by another staff member'], 409);
            }

            if (!$conversation['claimed_by']) {
                $con->prepare("UPDATE conversations SET claimed_by = ?, claimed_at = NOW(6) WHERE id = ?")
                    ->execute([$this->userLoad['id'], $conversationId]);
            }
        } else {
            $conversation = $this->getOrCreateConversation($con, $this->userLoad['id']);
            $conversationId = $conversation['id'];
        }

        $id = $this->generateUniqueId($con, 'msg_', 'messages');

        $this->dbInsert($con, 'messages', [
            'id' => $id,
            'conversation_id' => $conversationId,
            'sender_id' => $this->userLoad['id'],
            'sender_role' => $isStaff ? $this->userLoad['role'] : 'customer',
            'body' => $body,
        ]);

        $readCol = $isStaff ? 'staff_last_read_at' : 'customer_last_read_at';
        $con->prepare("UPDATE conversations SET `$readCol` = NOW(6) WHERE id = ?")->execute([$conversationId]);

        $stmt = $con->prepare("SELECT * FROM messages WHERE id = ?");
        $stmt->execute([$id]);

        $this->consoleLog($this->mapMessageRow($stmt->fetch(PDO::FETCH_ASSOC)), 201);
    }
    // == CHAT ==

    // == REVIEWS ==
    private function mapReviewRow(array $row): array
    {
        return [
            'id' => $row['id'],
            'userId' => $row['user_id'],
            'userName' => $row['user_name'] ?? null,
            'subjectType' => $row['subject_type'],
            'subjectId' => $row['subject_id'],
            'rating' => (int) $row['rating'],
            'comment' => $row['comment'],
            'createdAt' => $row['created_at'],
        ];
    }

    public function fetchReviews(string $subjectType, ?string $subjectId = null): void
    {
        $db = Database::getInstance();
        $con = $db->connect();

        if ($subjectType === 'all') {
            $this->requireAuth(['admin', 'staff']);

            $stmt = $con->query("
                SELECT r.*, u.name AS user_name
                FROM reviews r
                JOIN users u ON u.id = r.user_id
                ORDER BY r.created_at DESC
            ");

            $this->consoleLog(array_map([$this, 'mapReviewRow'], $stmt->fetchAll(PDO::FETCH_ASSOC)));
        }

        if (!in_array($subjectType, ['product', 'collection', 'site'], true)) {
            $this->consoleLog(['error' => 'Invalid subject type'], 400);
        }

        $subjectId = $subjectType === 'site' ? 'site' : trim((string) $subjectId);
        if (!$this->check_required_fields(['subjectId'], ['subjectId' => $subjectId])) return;

        $stmt = $con->prepare("
            SELECT r.*, u.name AS user_name
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.subject_type = ? AND r.subject_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$subjectType, $subjectId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $avgStmt = $con->prepare("
            SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS count
            FROM reviews WHERE subject_type = ? AND subject_id = ?
        ");
        $avgStmt->execute([$subjectType, $subjectId]);
        $agg = $avgStmt->fetch(PDO::FETCH_ASSOC);

        $this->consoleLog([
            'average' => round((float) $agg['average'], 2),
            'count' => (int) $agg['count'],
            'reviews' => array_map([$this, 'mapReviewRow'], $rows),
        ]);
    }

    public function addReview(array $data): void
    {
        $this->requireAuth();

        $subjectType = trim($data['subjectType'] ?? '');
        $rating = (int) ($data['rating'] ?? 0);
        $comment = trim($data['comment'] ?? '');
        $subjectId = $subjectType === 'site' ? 'site' : trim((string) ($data['subjectId'] ?? ''));

        if (!in_array($subjectType, ['product', 'collection', 'site'], true)) {
            $this->consoleLog(['error' => 'Invalid subject type'], 400);
        }

        if (!$this->check_required_fields(['subjectId', 'rating', 'comment'], [
            'subjectId' => $subjectId, 'rating' => $rating, 'comment' => $comment,
        ])) return;

        if ($rating < 1 || $rating > 5) {
            $this->consoleLog(['error' => 'Rating must be between 1 and 5'], 400);
        }

        $db = Database::getInstance();
        $con = $db->connect();

        if ($subjectType === 'product') {
            if (!$this->fetchCol($con, 'products', ['id' => $subjectId], ['id'])) {
                $this->consoleLog(['error' => 'Product not found'], 404);
            }

            $purchased = $con->prepare("
                SELECT 1 FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE o.user_id = ? AND oi.product_id = ? AND o.payment_status = 'success'
                LIMIT 1
            ");
            $purchased->execute([$this->userLoad['id'], $subjectId]);

            if (!$purchased->fetch()) {
                $this->consoleLog(['error' => 'You can only review products you have purchased'], 403);
            }
        } elseif ($subjectType === 'collection') {
            if (!$this->fetchCol($con, 'collections', ['id' => $subjectId], ['id'])) {
                $this->consoleLog(['error' => 'Collection not found'], 404);
            }
        }

        $id = $this->generateUniqueId($con, 'rev_', 'reviews');

        try {
            $this->dbInsert($con, 'reviews', [
                'id' => $id,
                'user_id' => $this->userLoad['id'],
                'subject_type' => $subjectType,
                'subject_id' => $subjectId,
                'rating' => $rating,
                'comment' => $comment,
            ]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000 || $e->getCode() === '23000') {
                $this->consoleLog(['error' => 'You have already reviewed this'], 409);
            }
            throw $e;
        }

        $stmt = $con->prepare("
            SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?
        ");
        $stmt->execute([$id]);

        $this->consoleLog($this->mapReviewRow($stmt->fetch(PDO::FETCH_ASSOC)), 201);
    }

    public function deleteReview(string $id): void
    {
        $this->requireAuth();

        $db = Database::getInstance();
        $con = $db->connect();

        $owner = $this->fetchCol($con, 'reviews', ['id' => $id], ['user_id']);

        if (!$owner) {
            $this->consoleLog(['error' => 'Review not found'], 404);
        }

        $isStaff = in_array($this->userLoad['role'] ?? null, ['admin', 'staff'], true);

        if (!$isStaff && $owner !== $this->userLoad['id']) {
            $this->consoleLog(['error' => 'Forbidden'], 403);
        }

        $deleted = $this->dbDelete($con, 'reviews', ['id' => $id]);

        $this->consoleLog(['id' => $id, 'deleted' => $deleted]);
    }
    // == REVIEWS ==
}
