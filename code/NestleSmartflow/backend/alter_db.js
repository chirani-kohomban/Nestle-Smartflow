const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'test',
            ssl: process.env.DB_HOST?.includes('tidbcloud') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
            multipleStatements: true
        });

        console.log("Running migrations...");
        
        try { await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('NESTLE_MANAGER', 'AREA_MANAGER', 'ADMIN', 'WAREHOUSE', 'DISTRIBUTOR', 'RETAILER') NOT NULL;"); console.log("Updated users table"); } catch (e) { console.log(e.message); }
        
        try { await connection.query("ALTER TABLE retailers ADD COLUMN user_id INT, ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;"); console.log("Updated retailers table"); } catch (e) { console.log(e.message); }
        
        try { await connection.query("ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0.00, ADD COLUMN locked BOOLEAN DEFAULT FALSE;"); console.log("Updated orders table"); } catch (e) { console.log(e.message); }
        
        try { await connection.query("ALTER TABLE deliveries ADD COLUMN arrived_at TIMESTAMP NULL, ADD COLUMN arrival_lat DECIMAL(10,8) NULL, ADD COLUMN arrival_lng DECIMAL(11,8) NULL;"); console.log("Updated deliveries table"); } catch (e) { console.log(e.message); }
        
        try { 
            await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                method ENUM('CASH', 'CHEQUE', 'PAY_LATER') NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                cheque_number VARCHAR(100),
                bank_name VARCHAR(100),
                cheque_date DATE,
                distributor_signature LONGTEXT,
                retailer_signature LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );`); 
            console.log("Created payments table"); 
        } catch (e) { console.log(e.message); }

        console.log("✅ Migrations applied successfully.");
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("Error running migrations:", err);
        process.exit(1);
    }
}

migrateDatabase();
