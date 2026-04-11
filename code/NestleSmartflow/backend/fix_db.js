const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDB() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartflow'
        });

        console.log("Altering the enum in users table to accept the new roles...");
        await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('NESTLE_MANAGER', 'AREA_MANAGER', 'ADMIN', 'WAREHOUSE', 'DISTRIBUTOR') NOT NULL DEFAULT 'AREA_MANAGER'");
        
        console.log("Updating broken users...");
        await db.query("UPDATE users SET role = 'WAREHOUSE' WHERE username = 'warehouse'");
        await db.query("UPDATE users SET role = 'DISTRIBUTOR' WHERE username = 'distributor'");

        console.log("✅ Database fixed!");
        await db.end();
    } catch (err) {
        console.error("Error fixing DB:", err);
    }
}
fixDB();
