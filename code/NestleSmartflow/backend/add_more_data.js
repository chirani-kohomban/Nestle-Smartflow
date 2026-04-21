const db = require('./db');
const bcrypt = require('bcrypt');

async function addMoreData() {
    try {
        console.log("Connecting to TiDB to add more data...");

        // 1. Add more Distributors
        console.log("Adding new distributors...");
        const newDistributors = [
            { username: 'distributor_kandy', password: 'password123', role: 'DISTRIBUTOR' },
            { username: 'distributor_galle', password: 'password123', role: 'DISTRIBUTOR' },
            { username: 'distributor_colombo_south', password: 'password123', role: 'DISTRIBUTOR' }
        ];

        for (const u of newDistributors) {
            // Check if exists safely
            const [exists] = await db.query('SELECT id FROM users WHERE username = ?', [u.username]);
            if (exists.length === 0) {
                const hash = await bcrypt.hash(u.password, 10);
                await db.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [u.username, hash, u.role]);
                console.log(`Added distributor: ${u.username}`);
            }
        }

        // 2. Add more Products
        console.log("Adding new products...");
        const newProducts = [
            ['Milo UHT 180ml (Pack of 6)', 'MIL-UHT-180', 'Pack'],
            ['Maggi Coconut Milk Powder 300g', 'MAG-CMP-300', 'Pouch'],
            ['Nescafé Classic 50g', 'NES-CLS-50', 'Jar'],
            ['Nestomalt 400g', 'NST-MLT-400', 'Box'],
            ['Cerelac Wheat & Milk 400g', 'CER-WM-400', 'Tin']
        ];

        // Need the WAREHOUSE user ID for last_updated_by
        const [warehouseUser] = await db.query("SELECT id FROM users WHERE role = 'WAREHOUSE' LIMIT 1");
        const warehouseId = warehouseUser.length > 0 ? warehouseUser[0].id : 1;

        for (const [name, sku, unit] of newProducts) {
             const [exists] = await db.query('SELECT id FROM products WHERE sku = ?', [sku]);
             if (exists.length === 0) {
                 const [prodResult] = await db.query('INSERT INTO products (name, sku, unit) VALUES (?, ?, ?)', [name, sku, unit]);
                 console.log(`Added product: ${name}`);
                 
                 // Add 1000 inventory items for it
                 await db.query('INSERT INTO inventory (product_id, quantity, last_updated_by) VALUES (?, ?, ?)', [prodResult.insertId, 1000, warehouseId]);
             }
        }

        console.log("✅ Successfully injected more presentation data!");
        process.exit(0);
    } catch (err) {
        console.error("Error adding data:", err);
        process.exit(1);
    }
}

addMoreData();
