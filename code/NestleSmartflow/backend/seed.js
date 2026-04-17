// seed.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedData() {
    try {
        console.log("Connecting to database...");
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartflow',
            port: process.env.DB_PORT || 3306,
            ssl: process.env.DB_HOST?.includes('tidbcloud') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
        });

        console.log("Emptying tables safely...");
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE deliveries');
        await db.query('TRUNCATE TABLE order_items');
        await db.query('TRUNCATE TABLE orders');
        await db.query('TRUNCATE TABLE retailers');
        await db.query('TRUNCATE TABLE inventory');
        await db.query('TRUNCATE TABLE products');
        await db.query('TRUNCATE TABLE users');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        // --- Users ---
        console.log("Seeding users...");
        const users = [
            { username: 'nestle_manager', password: 'password123', role: 'NESTLE_MANAGER' },
            { username: 'area_manager', password: 'password123', role: 'AREA_MANAGER' },
            { username: 'admin', password: 'password123', role: 'ADMIN' },
            { username: 'warehouse', password: 'password123', role: 'WAREHOUSE' },
            { username: 'distributor', password: 'password123', role: 'DISTRIBUTOR' }
        ];

        const userIds = {};
        for (const u of users) {
            const hash = await bcrypt.hash(u.password, 10);
            const [result] = await db.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [u.username, hash, u.role]);
            userIds[u.role] = result.insertId;
        }

        // --- Products ---
        console.log("Seeding Products...");
        const products = [
            ['Nescafé Gold Blend 200g', 'NES-GLD-200', 'Jar'],
            ['KitKat 4 Finger (Box 24)', 'KIT-4FG-B24', 'Box'],
            ['Maggi 2-Minute Noodles', 'MAG-2M-NDL', 'Carton'],
            ['Milo Powder Tin 400g', 'MIL-TIN-400', 'Tin']
        ];

        const productIds = [];
        for (const [name, sku, unit] of products) {
            const [result] = await db.query('INSERT INTO products (name, sku, unit) VALUES (?, ?, ?)', [name, sku, unit]);
            productIds.push(result.insertId);
        }

        // --- Inventory ---
        console.log("Seeding Inventory...");
        for (const pid of productIds) {
            await db.query('INSERT INTO inventory (product_id, quantity, last_updated_by) VALUES (?, ?, ?)', [pid, 500, userIds['WAREHOUSE']]);
        }

        // --- Retailers ---
        console.log("Seeding Retailers...");
        // Some dummy coordinates in a small area
        const retailers = [
            ['Shop A', '123 Main St', 6.9319, 79.8478],
            ['Supermart B', '45 Park Ave', 6.9350, 79.8510],
            ['Daily Grocery C', '88 High Rd', 6.9380, 79.8450],
            ['Convenience Store D', '22 East Wing', 6.9400, 79.8550]
        ];

        for (const [name, address, lat, lng] of retailers) {
            await db.query('INSERT INTO retailers (name, address, lat, lng) VALUES (?, ?, ?, ?)', [name, address, lat, lng]);
        }

        console.log("✅ Dummy data injected successfully!");
        await db.end();
        process.exit(0);

    } catch (err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
}

seedData();