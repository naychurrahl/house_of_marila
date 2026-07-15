DROP DATABASE IF EXISTS marila;
CREATE DATABASE marila;
USE marila;


-- ============================================
-- Marila — MySQL Schema
-- ============================================

-- Collections
CREATE TABLE collections (
  id          VARCHAR(100)   NOT NULL PRIMARY KEY,
  name        VARCHAR(150)   NOT NULL,
  description VARCHAR(255)   NOT NULL,
  season      VARCHAR(50)    NOT NULL,
  year        VARCHAR(10)    NOT NULL,
  cover_image VARCHAR(500)   NOT NULL,
  story       TEXT           NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE collection_images (
  id            INTEGER PRIMARY KEY AUTO_INCREMENT,
  collection_id VARCHAR(100)  NOT NULL,
  image         VARCHAR(500)  NOT NULL,
  position      INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  INDEX idx_collection_images (collection_id, position)
);

-- Categories (managed list backing the Shop page filter + product form)
CREATE TABLE categories (
  name       VARCHAR(50) NOT NULL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id            VARCHAR(100)   NOT NULL PRIMARY KEY,
  name          VARCHAR(150)   NOT NULL UNIQUE,
  price         DECIMAL(10, 2) NOT NULL,
  category      VARCHAR(50)    NOT NULL,
  description   TEXT           NOT NULL,
  in_stock      BOOLEAN        NOT NULL DEFAULT TRUE,
  collection_id VARCHAR(100)   NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
  INDEX idx_products_category (category),
  INDEX idx_products_collection (collection_id)
);

CREATE TABLE product_images (
  id         INTEGER PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(100)  NOT NULL,
  image      VARCHAR(500)  NOT NULL,
  position   INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images (product_id, position)
);

CREATE TABLE product_sizes (
  id         INTEGER PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(100)  NOT NULL,
  size       VARCHAR(20)   NOT NULL,
  position   INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_product_size (product_id, size)
);

CREATE TABLE product_colors (
  id         INTEGER PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(100)  NOT NULL,
  color      VARCHAR(30)   NOT NULL,
  position   INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_product_color (product_id, color)
);

CREATE TABLE product_tags (
  id         INTEGER PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(100)  NOT NULL,
  tag        VARCHAR(50)   NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_product_tag (product_id, tag)
);

-- Articles (Journal)
CREATE TABLE articles (
  id          VARCHAR(100)  NOT NULL PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  excerpt     VARCHAR(500)  NOT NULL,
  content     LONGTEXT      NOT NULL,
  author      VARCHAR(100)  NOT NULL,
  date        DATE          NOT NULL,
  category    VARCHAR(50)   NOT NULL,
  cover_image VARCHAR(500)  NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE article_images (
  id         INTEGER PRIMARY KEY AUTO_INCREMENT,
  article_id VARCHAR(100)  NOT NULL,
  image      VARCHAR(500)  NOT NULL,
  position   INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_article_images (article_id, position)
);

-- Store locator
CREATE TABLE locations (
  id      VARCHAR(100)  NOT NULL PRIMARY KEY,
  name    VARCHAR(150)  NOT NULL,
  address VARCHAR(255)  NOT NULL,
  city    VARCHAR(150)  NOT NULL,
  hours   VARCHAR(150)  NOT NULL,
  phone   VARCHAR(30)   NOT NULL
);

-- Site-wide branding/settings - single row, always id=1
CREATE TABLE site_settings (
  id         INT PRIMARY KEY DEFAULT 1,
  name       VARCHAR(100)  NOT NULL DEFAULT 'MARILA',
  tagline    VARCHAR(100)  NULL,
  logo       VARCHAR(500)  NULL,
  instagram  VARCHAR(255)  NULL,
  twitter    VARCHAR(255)  NULL,
  pinterest  VARCHAR(255)  NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Users / auth
CREATE TABLE users (
  id         VARCHAR(100)  NOT NULL PRIMARY KEY,
  email      VARCHAR(100)  NOT NULL UNIQUE,
  name       VARCHAR(100)  NULL,
  role       ENUM('guest', 'customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
  active     ENUM('active', 'inactive') NOT NULL DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE hashes (
  id         VARCHAR(100)  NOT NULL PRIMARY KEY,
  ash        VARCHAR(255)  NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_resets (
  id         VARCHAR(100)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(100)  NOT NULL,
  token_hash VARCHAR(64)   NOT NULL,
  expires_at DATETIME      NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Addresses (per-user address book, matches the structured Address type
-- rather than the single-string address used on the older ecommerce backend)
CREATE TABLE addresses (
  id         VARCHAR(100)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(100)  NOT NULL,
  name       VARCHAR(100)  NOT NULL,
  street     VARCHAR(200)  NOT NULL,
  city       VARCHAR(100)  NOT NULL,
  state      VARCHAR(100)  NOT NULL,
  zip        VARCHAR(20)   NOT NULL,
  country    VARCHAR(100)  NOT NULL,
  is_default BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
);

-- Orders
CREATE TABLE orders (
  id         VARCHAR(100)  NOT NULL PRIMARY KEY,
  user_id        VARCHAR(100)  NOT NULL,
  date           DATE          NOT NULL DEFAULT (CURRENT_DATE),
  status         ENUM('processing', 'shipped', 'delivered') NOT NULL DEFAULT 'processing',
  payment_status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  subtotal       DECIMAL(10, 2) NOT NULL,
  shipping_fee   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax            DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total          DECIMAL(10, 2) NOT NULL,
  address_id     VARCHAR(100)  NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_orders_user (user_id)
);

CREATE TABLE order_items (
  id         INTEGER PRIMARY KEY AUTO_INCREMENT,
  order_id   VARCHAR(100)  NOT NULL,
  product_id VARCHAR(100)  NOT NULL,
  size       VARCHAR(20)   NOT NULL,
  color      VARCHAR(30)   NOT NULL,
  quantity   INT           NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  UNIQUE KEY uniq_order_line (order_id, product_id, size, color)
);

-- Cart (cart_id == users.id, one active cart per user)
CREATE TABLE cart_items (
  cart_id    VARCHAR(100)  NOT NULL,
  product_id VARCHAR(100)  NOT NULL,
  size       VARCHAR(20)   NOT NULL,
  color      VARCHAR(30)   NOT NULL,
  quantity   INT           NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cart_id, product_id, size, color),
  FOREIGN KEY (cart_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Wishlist (per-user, no size/color - just a saved product)
CREATE TABLE wishlist_items (
  user_id    VARCHAR(100)  NOT NULL,
  product_id VARCHAR(100)  NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


-- ============================================
-- Seed Data
-- ============================================

INSERT INTO collections (id, name, description, season, year, cover_image, story) VALUES
('spring-2026', 'Spring/Summer 2026', 'Ethereal silhouettes meet structured rebellion', 'Spring/Summer', '2026',
 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
 'A meditation on form and formlessness. This collection explores the tension between control and release, finding beauty in the space between intention and accident. Shot on 35mm film in an abandoned brutalist structure outside Tokyo.'),
('fall-2025', 'Fall/Winter 2025', 'Heritage reinterpreted through a contemporary lens', 'Fall/Winter', '2025',
 'https://images.unsplash.com/photo-1682718619762-305dadabaef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
 'Drawing from archival military tailoring and workwear, reimagined in unexpected materials. Each piece is a conversation between then and now.');

INSERT INTO collection_images (collection_id, image, position) VALUES
('spring-2026', 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('spring-2026', 'https://images.unsplash.com/photo-1603189343302-e603f7add05a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 1),
('spring-2026', 'https://images.unsplash.com/photo-1613909671501-f9678ffc1d33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 2),
('fall-2025', 'https://images.unsplash.com/photo-1682718619762-305dadabaef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('fall-2025', 'https://images.unsplash.com/photo-1549298222-1c31e8915347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 1);

INSERT INTO categories (name) VALUES
('Outerwear'), ('Dresses'), ('Bottoms'), ('Accessories'), ('Tops'), ('Knits'), ('Shoes');

INSERT INTO products (id, name, price, category, description, in_stock, collection_id) VALUES
('1', 'Deconstructed Blazer', 895, 'Outerwear', 'Oversized blazer with raw-edge detailing and asymmetric closure. Crafted from Italian wool with exposed seam finishing.', TRUE, 'spring-2026'),
('2', 'Silk Slip Dress', 645, 'Dresses', 'Bias-cut silk charmeuse dress with delicate spaghetti straps. Features contrast topstitching and adjustable fit.', TRUE, 'spring-2026'),
('3', 'Wide-Leg Trousers', 495, 'Bottoms', 'High-waisted trousers in heavyweight linen. Relaxed through the hip with dramatic wide leg and extended inseam.', TRUE, 'spring-2026'),
('4', 'Leather Shoulder Bag', 795, 'Accessories', 'Structured shoulder bag in vegetable-tanned leather. Minimalist hardware with adjustable strap and interior pocket.', TRUE, 'spring-2026'),
('5', 'Oversized Cotton Shirt', 395, 'Tops', 'Relaxed-fit shirt in crisp poplin cotton. Dropped shoulder with elongated sleeves and curved hem.', TRUE, 'spring-2026'),
('6', 'Wool Overcoat', 1295, 'Outerwear', 'Double-breasted overcoat in heavyweight melton wool. Classic silhouette with modern proportions and peak lapels.', TRUE, 'fall-2025'),
('7', 'Cashmere Turtleneck', 595, 'Knits', 'Luxuriously soft cashmere turtleneck with ribbed trim. Slightly relaxed fit through the body.', TRUE, 'fall-2025'),
('8', 'Pleated Midi Skirt', 545, 'Bottoms', 'Accordion-pleated skirt in lustrous satin-back crepe. High waist with concealed zipper closure.', FALSE, 'fall-2025'),
('9', 'Chunky Chelsea Boots', 695, 'Shoes', 'Platform chelsea boots in polished leather. Chunky lug sole with elastic side goring.', TRUE, 'fall-2025');

INSERT INTO product_images (product_id, image, position) VALUES
('1', 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('1', 'https://images.unsplash.com/photo-1557777586-f6682739fcf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 1),
('2', 'https://images.unsplash.com/photo-1603189343302-e603f7add05a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('3', 'https://images.unsplash.com/photo-1613909671501-f9678ffc1d33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('4', 'https://images.unsplash.com/photo-1589363358751-ab05797e5629?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('5', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('6', 'https://images.unsplash.com/photo-1682718619762-305dadabaef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('7', 'https://images.unsplash.com/photo-1549298222-1c31e8915347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('8', 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0),
('9', 'https://images.unsplash.com/photo-1589363358751-ab05797e5629?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 0);

INSERT INTO product_sizes (product_id, size, position) VALUES
('1', 'XS', 0), ('1', 'S', 1), ('1', 'M', 2), ('1', 'L', 3), ('1', 'XL', 4),
('2', 'XS', 0), ('2', 'S', 1), ('2', 'M', 2), ('2', 'L', 3),
('3', '24', 0), ('3', '26', 1), ('3', '28', 2), ('3', '30', 3), ('3', '32', 4),
('4', 'One Size', 0),
('5', 'XS', 0), ('5', 'S', 1), ('5', 'M', 2), ('5', 'L', 3), ('5', 'XL', 4),
('6', 'XS', 0), ('6', 'S', 1), ('6', 'M', 2), ('6', 'L', 3), ('6', 'XL', 4),
('7', 'XS', 0), ('7', 'S', 1), ('7', 'M', 2), ('7', 'L', 3),
('8', 'XS', 0), ('8', 'S', 1), ('8', 'M', 2), ('8', 'L', 3),
('9', '36', 0), ('9', '37', 1), ('9', '38', 2), ('9', '39', 3), ('9', '40', 4), ('9', '41', 5);

INSERT INTO product_colors (product_id, color, position) VALUES
('1', 'Black', 0), ('1', 'Ivory', 1), ('1', 'Charcoal', 2),
('2', 'Ivory', 0), ('2', 'Sage', 1), ('2', 'Rust', 2),
('3', 'Black', 0), ('3', 'Ecru', 1), ('3', 'Navy', 2),
('4', 'Black', 0), ('4', 'Tan', 1), ('4', 'Burgundy', 2),
('5', 'White', 0), ('5', 'Black', 1), ('5', 'Slate', 2),
('6', 'Camel', 0), ('6', 'Navy', 1), ('6', 'Black', 2),
('7', 'Ivory', 0), ('7', 'Charcoal', 1), ('7', 'Camel', 2),
('8', 'Black', 0), ('8', 'Burgundy', 1), ('8', 'Forest', 2),
('9', 'Black', 0), ('9', 'Brown', 1);

INSERT INTO product_tags (product_id, tag) VALUES
('1', 'New Arrival'), ('1', 'Signature'),
('2', 'Signature'),
('3', 'Bestseller'),
('4', 'New Arrival'),
('5', 'Bestseller'),
('6', 'Signature'),
('7', 'Bestseller'),
('9', 'New Arrival');

INSERT INTO articles (id, title, excerpt, content, author, date, category, cover_image) VALUES
('1', 'In Conversation: On Process and Permanence', 'Designer Anna Chen discusses her approach to creating garments meant to last beyond seasons.', 'Full article content here...', 'Maya Rodriguez', '2026-05-15', 'Interview',
 'https://images.unsplash.com/photo-1549298222-1c31e8915347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('2', 'The Archive: Revisiting 2019', 'A look back at the collection that defined our ethos and set our direction for the years to come.', 'Full article content here...', 'Studio Team', '2026-05-01', 'Archive',
 'https://images.unsplash.com/photo-1682718619762-305dadabaef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('3', 'Campaign: Spring/Summer 2026', 'Shot on location in Tokyo. Photography by Kenji Watanabe.', 'Full article content here...', 'Studio Team', '2026-04-20', 'Campaign',
 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080');

INSERT INTO locations (id, name, address, city, hours, phone) VALUES
('1', 'Downtown Showroom', '123 Greene Street', 'New York, NY 10012', 'Mon-Sat: 11AM-7PM, Sun: 12PM-6PM', '+1 (212) 555-0100'),
('2', 'West Coast Studio', '456 Melrose Avenue', 'Los Angeles, CA 90038', 'Mon-Sat: 11AM-7PM, Sun: 12PM-6PM', '+1 (323) 555-0200');

INSERT INTO site_settings (id, name, tagline, instagram, twitter, pinterest) VALUES
(1, 'MARILA', 'House of', '#', '#', '#');

-- Demo accounts. bcrypt hash below is password_hash('1234', PASSWORD_DEFAULT) -
-- same fixed seed hash used across the other backends so '1234' logs into any of them.
INSERT INTO users (id, email, name, role, active) VALUES
('admin_1', 'admin@marila.com', 'Studio Admin', 'admin', 'active'),
('cust_1', 'customer@marila.com', 'Jane Doe', 'customer', 'active');

INSERT INTO hashes (id, ash) VALUES
('admin_1', '$2y$10$9Xs8WfqlF8bFSHiqwDTp.u8mt1Id0J2bkZEQw0C4A0iTOz3istuK6'),
('cust_1', '$2y$10$9Xs8WfqlF8bFSHiqwDTp.u8mt1Id0J2bkZEQw0C4A0iTOz3istuK6');

INSERT INTO addresses (id, user_id, name, street, city, state, zip, country, is_default) VALUES
('addr_1', 'cust_1', 'Jane Doe', '456 Oak Ave', 'Town', 'State', '67890', 'USA', TRUE);


-- ============================================
-- Functions and Triggers
-- ============================================

-- Procedure uniqid
DROP PROCEDURE IF EXISTS generate_uniqid;

DELIMITER $$
CREATE PROCEDURE generate_uniqid(
  IN  prefix      VARCHAR(50),
  IN  more_entropy BOOLEAN,
  IN  tbl         VARCHAR(64),
  IN  col         VARCHAR(64),
  OUT result      VARCHAR(100)
)
BEGIN
  DECLARE candidate VARCHAR(100);
  DECLARE exists_count INT;
  DECLARE sql_query   TEXT;
  DECLARE done        BOOLEAN DEFAULT FALSE;

  REPEAT
    SET candidate = CONCAT(
      prefix,
      LPAD(HEX(UNIX_TIMESTAMP()), 8, '0'),
      LPAD(HEX(MICROSECOND(NOW(6))), 5, '0'),
      LPAD(HEX(UUID_SHORT() & 0xFFFFFF), 6, '0')
    );

    IF more_entropy THEN
      SET candidate = CONCAT(candidate, LPAD(FLOOR(RAND() * 1000000), 6, '0'));
    END IF;

    SET sql_query = CONCAT(
      'SELECT COUNT(*) INTO @id_count FROM `', tbl, '` WHERE `', col, '` = ?'
    );

    SET @candidate = candidate;
    PREPARE stmt FROM sql_query;
    EXECUTE stmt USING @candidate;
    DEALLOCATE PREPARE stmt;

    SET exists_count = @id_count;

    IF exists_count = 0 THEN
      SET done = TRUE;
    END IF;

  UNTIL done END REPEAT;

  SET result = candidate;
END$$
DELIMITER ;

-- Trigger before_product_insert
DROP TRIGGER IF EXISTS before_product_insert;

DELIMITER $$
CREATE TRIGGER before_product_insert
BEFORE INSERT ON products
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE name = NEW.name) THEN
    SIGNAL SQLSTATE '45003'
    SET MESSAGE_TEXT = 'DUPLICATE_PRODUCT_NAME';
  END IF;
END$$
DELIMITER ;

-- Trigger before_product_update
DROP TRIGGER IF EXISTS before_product_update;

DELIMITER $$
CREATE TRIGGER before_product_update
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM products
    WHERE name = NEW.name
    AND id != NEW.id
  ) THEN
    SIGNAL SQLSTATE '45003'
    SET MESSAGE_TEXT = 'DUPLICATE_PRODUCT_NAME';
  END IF;
END$$
DELIMITER ;

-- Trigger before_user_insert_mail
DROP TRIGGER IF EXISTS before_user_insert_mail;

DELIMITER $$
CREATE TRIGGER before_user_insert_mail
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = NEW.email) THEN
    SIGNAL SQLSTATE '45001'
    SET MESSAGE_TEXT = 'DUPLICATE_EMAIL';
  END IF;
END$$
DELIMITER ;

-- Trigger before_user_update_email
DROP TRIGGER IF EXISTS before_user_update_email;

DELIMITER $$
CREATE TRIGGER before_user_update_email
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM users
    WHERE email = NEW.email
    AND id != NEW.id
  ) THEN
    SIGNAL SQLSTATE '45001'
    SET MESSAGE_TEXT = 'DUPLICATE_EMAIL';
  END IF;
END$$
DELIMITER ;

/*
CALL generate_uniqid('ord_', FALSE, 'orders', 'id', @new_id);
SELECT @new_id;
*/
