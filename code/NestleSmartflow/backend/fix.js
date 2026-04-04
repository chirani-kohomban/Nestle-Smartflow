const mysql = require('mysql2/promise');

async function createLogsTable() {
    try {
        const db = await mysql.createConnection({host:'localhost', user:'root', database:'smartflow'});
        
        // Create table query
        const sql = `
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
        );`;
        
        await db.query(sql);
        console.log("Table 'inventory_logs' created successfully!");
        
        await db.end();
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

createLogsTable();
