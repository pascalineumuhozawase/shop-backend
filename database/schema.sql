CREATE DATABASE IF NOT EXISTS online_shopping_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_shopping_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_users_email (email), KEY idx_users_role (role), KEY idx_users_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_categories_name (name), UNIQUE KEY uq_categories_slug (slug), KEY idx_categories_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  image_url VARCHAR(2048) NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  popularity INT UNSIGNED NOT NULL DEFAULT 0,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT chk_products_price CHECK (price >= 0), CONSTRAINT chk_products_rating CHECK (rating >= 0 AND rating <= 5),
  KEY idx_products_category_active (category_id, is_active), KEY idx_products_price (price),
  KEY idx_products_created (created_at), KEY idx_products_featured (is_featured, popularity)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_carts_user (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_cart_product (cart_id, product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_cart_quantity CHECK (quantity > 0), KEY idx_cart_items_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  shipping_address VARCHAR(500) NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_region VARCHAR(100) NULL,
  shipping_postal_code VARCHAR(30) NULL,
  shipping_country VARCHAR(100) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cod', 'mock') NOT NULL,
  payment_status ENUM('pending', 'mock_paid', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND shipping_fee >= 0 AND total >= 0),
  KEY idx_orders_user_created (user_id, created_at), KEY idx_orders_status (status), KEY idx_orders_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(180) NOT NULL,
  image_url VARCHAR(2048) NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT chk_order_item_values CHECK (unit_price >= 0 AND quantity > 0 AND line_total >= 0),
  KEY idx_order_items_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  method ENUM('cod', 'mock') NOT NULL,
  status ENUM('pending', 'mock_paid', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  reference VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_payments_order (order_id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0), KEY idx_payments_status (status)
) ENGINE=InnoDB;