-- Nestlé SmartFlow MVP - Database Schema
-- To use this: CREATE DATABASE smartflow; USE smartflow; source schema.sql;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF', 'MANAGER') NOT NULL DEFAULT 'STAFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Inventory Table (1-1 relationship with products)
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    last_updated_by INT,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (last_updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Inventory Logs Table (Transaction ledger)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    quantity_change INT NOT NULL,
    stock_after INT NOT NULL,
    action_type ENUM('IN', 'OUT', 'INITIAL') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Data
-- Note: In a production system, passwords MUST be hashed.
-- Here we're using bcrypt hashes for the word "password123".
-- $2b$10$w8T.N0Y/9QhZ2EItS7zEtuV3H4YjW.uWkUeFzI8.6GzU1K5A0cKHO = "password123"

INSERT IGNORE INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$w8T.N0Y/9QhZ2EItS7zEtuV3H4YjW.uWkUeFzI8.6GzU1K5A0cKHO', 'ADMIN'),
('staff', '$2b$10$w8T.N0Y/9QhZ2EItS7zEtuV3H4YjW.uWkUeFzI8.6GzU1K5A0cKHO', 'STAFF'),
('manager', '$2b$10$w8T.N0Y/9QhZ2EItS7zEtuV3H4YjW.uWkUeFzI8.6GzU1K5A0cKHO', 'MANAGER');

-- Seed Products
INSERT IGNORE INTO products (id, name, sku, unit) VALUES 
(1, 'Nespresso Pods - Columbia', 'NES-POD-COL', 'Pack'),
(2, 'KitKat Chunky', 'KIT-CHK-01', 'Box');

-- Seed Inventory
INSERT IGNORE INTO inventory (product_id, quantity, last_updated_by) VALUES 
(1, 500, 1),
(2, 1200, 1);
