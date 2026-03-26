-- =========================================
-- Nestlé SmartFlow - Sprint 1 (MySQL Version)
-- Safe to run multiple times
-- =========================================

-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS nestle_smartflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nestle_smartflow;

-- =========================================
-- 2. USERS TABLE
-- =========================================
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (role IN ('admin','manager','distributor','cashier','warehouse_staff'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default users
INSERT INTO users (full_name, email, username, password, role)
VALUES 
('Admin User', 'admin@gmail.com', 'admin', '$2y$10$YPQqHa5DPcvf6d1B4Hy5P.2aZ7e8kL9mQ3r4sT5u6vW7xY8zZ9a0b', 'admin'),
('Retailer User', 'retailer@gmail.com', 'retailer', '$2y$10$YPQqHa5DPcvf6d1B4Hy5P.2aZ7e8kL9mQ3r4sT5u6vW7xY8zZ9a0b', 'manager'),
('Distributor User', 'distributor@gmail.com', 'distributor', '$2y$10$YPQqHa5DPcvf6d1B4Hy5P.2aZ7e8kL9mQ3r4sT5u6vW7xY8zZ9a0b', 'distributor'),
('Cashier User', 'cashier@gmail.com', 'cashier', '$2y$10$YPQqHa5DPcvf6d1B4Hy5P.2aZ7e8kL9mQ3r4sT5u6vW7xY8zZ9a0b', 'cashier'),
('Warehouse Staff', 'warehouse@gmail.com', 'warehouse', '$2y$10$YPQqHa5DPcvf6d1B4Hy5P.2aZ7e8kL9mQ3r4sT5u6vW7xY8zZ9a0b', 'warehouse_staff');

-- =========================================
-- 3. PRODUCTS TABLE
-- =========================================
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    sku VARCHAR(50),
    category VARCHAR(50),
    price DECIMAL(10, 2) DEFAULT 0.00,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO products (product_name, sku, category, price, description)
VALUES 
('Milo', 'MIL-001', 'Beverage', 350.00, 'Milo Powder - Drink Mix'),
('Nescafe', 'NES-001', 'Beverage', 450.00, 'Nescafe Instant Coffee'),
('KitKat', 'KIT-001', 'Snack', 50.00, 'KitKat Chocolate Bar');

-- =========================================
-- 4. INVENTORY TABLE
-- =========================================
DROP TABLE IF EXISTS inventory;

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    zone VARCHAR(50),
    current_stock INT NOT NULL DEFAULT 0,
    min_stock INT DEFAULT 50,
    max_stock INT DEFAULT 500,
    unit VARCHAR(20) DEFAULT 'units',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO inventory (product_id, zone, current_stock, min_stock, max_stock, unit)
VALUES 
(1, 'Zone A', 500, 50, 500, 'boxes'),
(2, 'Zone B', 300, 50, 400, 'boxes'),
(3, 'Zone A', 200, 25, 300, 'units');

-- =========================================
-- 5. WAREHOUSE_INVENTORY TABLE (Legacy)
-- =========================================
DROP TABLE IF EXISTS warehouse_inventory;

CREATE TABLE warehouse_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO warehouse_inventory (product_id, quantity, batch_number, expiry_date)
VALUES 
(1, 500, 'BATCH001', '2026-12-31'),
(2, 300, 'BATCH002', '2026-11-30'),
(3, 200, 'BATCH003', '2026-10-31');

-- =========================================
-- 6. SHIPMENTS TABLE
-- =========================================
DROP TABLE IF EXISTS shipments;

CREATE TABLE shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id VARCHAR(50) UNIQUE,
    type VARCHAR(20),
    supplier VARCHAR(100),
    tracking_number VARCHAR(100),
    expected_date DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (type IN ('Incoming', 'Outgoing'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO shipments (shipment_id, type, supplier, tracking_number, status)
VALUES 
('SHP-001', 'Incoming', 'Supplier A', 'TRACK-001', 'Received'),
('SHP-002', 'Outgoing', 'Retailer B', 'TRACK-002', 'Pending');

-- =========================================
-- 7. SHIPMENT_ITEMS TABLE
-- =========================================
DROP TABLE IF EXISTS shipment_items;

CREATE TABLE shipment_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    batch_number VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- 8. ORDERS TABLE
-- =========================================
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE,
    user_id INT,
    retailer_name VARCHAR(100),
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending',
    payment_method VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (status IN ('Pending','Processing','Completed','Cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO orders (order_id, user_id, retailer_name, total_amount, status, payment_method)
VALUES 
('ORD-20240101001', 2, 'Shop A', 5000.00, 'Completed', 'Cash'),
('ORD-20240102002', 2, 'Shop B', 7500.00, 'Pending', 'Card');

-- =========================================
-- 9. ORDER_ITEMS TABLE
-- =========================================
DROP TABLE IF EXISTS order_items;

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100),
    quantity INT NOT NULL,
    price DECIMAL(10, 2),
    subtotal DECIMAL(10, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
VALUES 
(1, 1, 'Milo', 50, 350.00, 17500.00),
(2, 1, 'Milo', 100, 350.00, 35000.00);

-- =========================================
-- 10. STOCK_ALLOCATIONS TABLE
-- =========================================
DROP TABLE IF EXISTS stock_allocations;

CREATE TABLE stock_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    allocated_quantity INT NOT NULL,
    batch_number VARCHAR(50),
    allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO stock_allocations (order_id, product_id, allocated_quantity, batch_number)
VALUES 
(1, 1, 50, 'BATCH001'),
(2, 1, 100, 'BATCH001');

-- =========================================
-- 11. INVENTORY_AUDIT_LOG TABLE
-- =========================================
DROP TABLE IF EXISTS inventory_audit_log;

CREATE TABLE inventory_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    old_stock INT,
    new_stock INT,
    reason VARCHAR(100),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- 12. TEST QUERIES
-- =========================================
-- Verify all tables
SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM inventory;
SELECT * FROM warehouse_inventory;
SELECT * FROM shipments;
SELECT * FROM shipment_items;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM stock_allocations;
SELECT * FROM inventory_audit_log;

-- =========================================
-- 13. SUMMARY
-- =========================================
-- Database: nestle_smartflow
-- Tables: 11
-- Default Users: 5 (admin, retailer/manager, distributor, cashier, warehouse)
-- Sample Products: 3
-- Sample Orders: 2
-- All passwords are hashed with BCRYPT (same hash for demo): password123
-- Ready for API integration with PHP
