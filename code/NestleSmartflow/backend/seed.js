const mysql = require('mysql2/promise');

async function seedData() {
    try {
        console.log("Connecting to database...");
        const db = await mysql.createConnection({host:'localhost', user:'root', database:'smartflow'});
        
        console.log("Emptying tables safely...");
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE inventory_logs');
        await db.query('TRUNCATE TABLE inventory');
        await db.query('TRUNCATE TABLE products');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Seeding Products...");
        const products = [
            ['Nescafé Gold Blend 200g', 'NES-GLD-200', 'Jar'],
            ['KitKat 4 Finger (Box 24)', 'KIT-4FG-B24', 'Box'],
            ['Maggi 2-Minute Noodles', 'MAG-2M-NDL', 'Carton'],
            ['Milo Powder Tin 400g', 'MIL-TIN-400', 'Tin'],
            ['Nestlé Pure Life Water 500ml', 'PLW-500-24', 'Case'],
            ['Aero Peppermint Bubble', 'AER-PEP-100', 'Box'],
            ['Smarties Hexatube', 'SMT-HEX-38', 'Carton']
        ];
        
        for (const [name, sku, unit] of products) {
            await db.query('INSERT INTO products (name, sku, unit) VALUES (?, ?, ?)', [name, sku, unit]);
        }

        console.log("Fetching inserted product IDs...");
        const [rows] = await db.query('SELECT id FROM products');
        const productIds = rows.map(r => r.id);

        console.log("Seeding Inventory & History...");
        const today = new Date();
        
        // Ensure user 1 (Admin) and user 2 (Staff) exist
        
        for (const pid of productIds) {
            // Random base stock between 100 and 1000
            let stock = Math.floor(Math.random() * 900) + 100;
            await db.query('INSERT INTO inventory (product_id, quantity, last_updated_by) VALUES (?, ?, ?)', [pid, stock, 2]); // staff user

            // Generate 3-8 random logs for the past 7 days for each product
            const logCount = Math.floor(Math.random() * 6) + 3;
            for (let i = 0; i < logCount; i++) {
                // Random day between 0 and 6 days in the past
                const daysAgo = Math.floor(Math.random() * 7);
                const logDate = new Date(today);
                logDate.setDate(today.getDate() - daysAgo);
                logDate.setHours(Math.floor(Math.random() * 12) + 8); // random business hour

                // Randomly receiving or shipping
                const isOut = Math.random() > 0.3; // 70% chance of out shipment
                const change = isOut ? -(Math.floor(Math.random() * 50) + 10) : (Math.floor(Math.random() * 100) + 20);
                const action = isOut ? 'OUT' : 'IN';
                
                await db.query(
                    'INSERT INTO inventory_logs (product_id, user_id, quantity_change, stock_after, action_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [pid, 2, change, stock, action, logDate]
                );
            }
        }

        console.log("Dummy data injected successfully!");
        await db.end();
        process.exit(0);
    } catch(err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
}

seedData();
