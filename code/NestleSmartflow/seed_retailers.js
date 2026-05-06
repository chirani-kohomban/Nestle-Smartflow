const bcrypt = require('bcrypt');
const db = require('./backend/db');

async function seed() {
    try {
        const passwordHash = await bcrypt.hash('password123', 10);
        
        const newRetailers = [
            { username: 'shop_kandy', name: 'Kandy Central Grocery', address: '12 Temple Rd, Kandy', lat: 7.2906, lng: 80.6337 },
            { username: 'shop_galle', name: 'Galle Fort Supermarket', address: '1 Lighthouse St, Galle', lat: 6.0535, lng: 80.2210 }
        ];

        for (const shop of newRetailers) {
            // Check if user exists
            const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [shop.username]);
            if (rows.length === 0) {
                const [res] = await db.query(
                    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                    [shop.username, passwordHash, 'RETAILER']
                );
                const userId = res.insertId;

                await db.query(
                    "INSERT INTO retailers (name, address, lat, lng, user_id) VALUES (?, ?, ?, ?, ?)",
                    [shop.name, shop.address, shop.lat, shop.lng, userId]
                );
                console.log(`Created ${shop.username} at [${shop.lat}, ${shop.lng}]`);
            } else {
                console.log(`${shop.username} already exists.`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

seed();
