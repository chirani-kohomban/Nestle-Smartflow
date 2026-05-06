const bcrypt = require('bcrypt');
const db = require('./backend/db');

async function seed() {
    try {
        const passwordHash = await bcrypt.hash('password123', 10);
        
        const newDistributors = [
            { username: 'distributor_colombo', lat: 6.9271, lng: 79.8612 },
            { username: 'distributor_kandy', lat: 7.2906, lng: 80.6337 },
            { username: 'distributor_galle', lat: 6.0535, lng: 80.2210 }
        ];

        for (const dist of newDistributors) {
            // Check if exists
            const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [dist.username]);
            if (rows.length === 0) {
                const [res] = await db.query(
                    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                    [dist.username, passwordHash, 'DISTRIBUTOR']
                );
                const userId = res.insertId;

                await db.query(
                    "INSERT INTO distributor_profiles (user_id, status, current_lat, current_lng) VALUES (?, 'OFFLINE', ?, ?)",
                    [userId, dist.lat, dist.lng]
                );
                console.log(`Created ${dist.username} at [${dist.lat}, ${dist.lng}]`);
            } else {
                console.log(`${dist.username} already exists.`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

seed();
