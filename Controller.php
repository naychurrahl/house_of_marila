<?php

require_once __DIR__ . '/Functions.php';

class Controller
{
    private string $action;

    private object $functions;

    private string $method;

    private string $param;

    private array $requestBody;

    private string $route;

    public function __construct(array $path, string $method)
    {
        $this->route  = $path[0] ?? null;
        $this->action = @urldecode($path[1] ?? null);
        $this->param  = @urldecode($path[2] ?? null);

        $this->method = $method;

        $this->functions = new Functions();

        //Get request body
        switch (True) {
            case ! empty($_POST):
                $this->requestBody = $_POST;
                break;

            case ! empty($_GET):
                $this->requestBody = $_GET;
                break;

            default:
                $this->requestBody = (array) json_decode(file_get_contents("php://input"), true);
        }

        $this->handle();
    }

    private function handle()
    {
        switch (strtolower($this->route)) {

            case 'ping':
                $this->functions->ping();
                break;

            case 'auth':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->ping();
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->logIn($this->requestBody['email'] ?? '', $this->requestBody['password'] ?? '')
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->logOut()
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'DELETE']);
                        break;
                }
                break;

            case 'user':
                switch ($this->method) {
                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addUser($this->requestBody)
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['POST']);
                        break;
                }
                break;

            case 'forgot':
                switch ($this->method) {
                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->forgotPassword($this->requestBody['email'] ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['POST']);
                        break;
                }
                break;

            case 'reset':
                switch ($this->method) {
                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->resetPassword(
                                $this->requestBody['email'] ?? '',
                                $this->requestBody['code'] ?? '',
                                $this->requestBody['newPassword'] ?? ''
                            )
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['POST']);
                        break;
                }
                break;

            case 'password':
                switch ($this->method) {
                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->changePassword(
                                $this->requestBody['currentPassword'] ?? '',
                                $this->requestBody['newPassword'] ?? ''
                            )
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['PUT']);
                        break;
                }
                break;

            case 'profile':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchProfile()
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateProfile($this->requestBody)
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'PUT']);
                        break;
                }
                break;

            case 'product':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchProduct($this->action ?? null, $this->requestBody)
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addProduct($this->requestBody)
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateProduct($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteProduct($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
                        break;
                }
                break;

            case 'collection':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchCollection($this->action ?? null)
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addCollection($this->requestBody)
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateCollection($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteCollection($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
                        break;
                }
                break;

            case 'article':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchArticle($this->action ?? null)
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addArticle($this->requestBody)
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateArticle($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteArticle($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
                        break;
                }
                break;

            case 'location':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchLocations()
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addLocation($this->requestBody)
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateLocation($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteLocation($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
                        break;
                }
                break;

            case 'cart':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchCart()
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addToCart($this->requestBody)
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateCartItem($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->removeFromCart($this->requestBody)
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
                        break;
                }
                break;

            case 'address':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchAddresses()
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addAddress($this->requestBody)
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateAddress($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteAddress($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
                        break;
                }
                break;

            case 'orders':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchOrder($this->action ?? null)
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addOrder($this->requestBody)
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateOrder($this->requestBody)
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'PUT']);
                        break;
                }
                break;

            case 'wishlist':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchWishlist()
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addWishlist($this->requestBody['productId'] ?? '')
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->removeWishlist($this->action ?? ($this->requestBody['productId'] ?? ''))
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'DELETE']);
                        break;
                }
                break;

            case 'payment':
                $this->functions->consoleLog(
                    $this->functions->verifyPayment($this->requestBody['reference'] ?? $this->action ?? '')
                );
                break;

            case 'payhook':
                $this->functions->paymentWebhook(file_get_contents('php://input'));
                break;

            case 'paystack-key':
                $this->functions->consoleLog(
                    $this->functions->fetchPaystackKey()
                );
                break;

            case 'category':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchCategories()
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addCategory($this->requestBody['name'] ?? '')
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteCategory($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'DELETE']);
                        break;
                }
                break;

            case 'settings':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchSettings()
                        );
                        break;

                    case 'PUT':
                        $this->functions->consoleLog(
                            $this->functions->updateSettings($this->requestBody)
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'PUT']);
                        break;
                }
                break;

            case 'staff':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchStaff()
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addStaff($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteStaff($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'DELETE']);
                        break;
                }
                break;

            case 'upload':
                switch ($this->method) {
                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->uploadImage($this->requestBody['folder'] ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['POST']);
                        break;
                }
                break;

            case 'chat':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchConversation(
                                $this->action ?? null,
                                ($this->requestBody['markRead'] ?? '1') !== '0'
                            )
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->postMessage($this->requestBody)
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST']);
                        break;
                }
                break;

            case 'review':
                switch ($this->method) {
                    case 'GET':
                        $this->functions->consoleLog(
                            $this->functions->fetchReviews($this->action ?? '', $this->param ?? null)
                        );
                        break;

                    case 'POST':
                        $this->functions->consoleLog(
                            $this->functions->addReview($this->requestBody)
                        );
                        break;

                    case 'DELETE':
                        $this->functions->consoleLog(
                            $this->functions->deleteReview($this->action ?? '')
                        );
                        break;

                    default:
                        $this->methodNotAllowed(['GET', 'POST', 'DELETE']);
                        break;
                }
                break;

            default:
                $this->endpointNotFound();
        }
    }

    private function methodNotAllowed(array $allowed): void
    {
        http_response_code(405);
        header('Allow: ' . implode(', ', $allowed));
        echo json_encode([
            'error' => 'Method Not Allowed',
            'allowed' => $allowed
        ]);
    }

    private function endpointNotFound(array $allinks = [], int $level = 0): void
    {

        $res = [
            [
                "header" => 'HTTP/1.1 404 Not Found',
                "rescode" => 404,
                "message" => [
                    "message" => 'Page not Found',
                    'Allowed' => $allinks,
                ],
            ],
            [
                "header" => 'HTTP/1.1 400 Bad Request',
                "rescode" => 400,
                "message" => [
                    'message' => 'Bad Request',
                    'Allowed' => $allinks,
                ],
            ],
        ];

        header($res[$level]['header']);

        echo json_encode($res[$level]['message']);
    }
}
