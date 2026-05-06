const db = require('./db');
const bcrypt = require('bcrypt');

async function run() {
    try {
        console.log("Fetching retailers without users...");
        const [retailers] = await db.query('SELECT * FROM retailers WHERE user_id IS NULL');
        
        if (retailers.length === 0) {
            console.log("All retailers already have login info.");
            process.exit(0);
        }

        console.log(`Found ${retailers.length} retailers to backfill.`);
        const passwordHash = await bcrypt.hash('password123', 10);

        for (const r of retailers) {
            // Generate a username based on the retailer name
            // E.g., "City Supermarket" -> "city_supermarket"
            let baseUsername = r.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
            if (!baseUsername) baseUsername = `retailer_${r.id}`;

            // Make username unique
            let username = baseUsername;
            let counter = 1;
            while (true) {
                const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
                if (existing.length === 0) break;
                username = `${baseUsername}${counter}`;
                counter++;
            }

            // Insert into users
            const [insertUser] = await db.query(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'RETAILER')",
                [username, passwordHash]
            );
            
            const newUserId = insertUser.insertId;

            // Link back to retailer
            await db.query('UPDATE retailers SET user_id = ? WHERE id = ?', [newUserId, r.id]);

            console.log(`✅ Created login for Retailer: ${r.name}`);
            console.log(`   Username: ${username}`);
            console.log(`   Password: password123`);
            console.log(`-----------------------------------`);
        }

        console.log("Done backfilling retailers.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
}

run();
