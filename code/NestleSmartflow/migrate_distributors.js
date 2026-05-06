const db = require('./backend/db');

async function migrate() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS distributor_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                status ENUM('OFFLINE', 'AVAILABLE', 'ON_ROUTE') NOT NULL DEFAULT 'OFFLINE',
                current_lat DECIMAL(10,8),
                current_lng DECIMAL(11,8),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('Table distributor_profiles created successfully.');

        // Initialize profiles for existing distributors
        const [distributors] = await db.query("SELECT id FROM users WHERE role = 'DISTRIBUTOR'");
        for (const d of distributors) {
            const [existing] = await db.query("SELECT id FROM distributor_profiles WHERE user_id = ?", [d.id]);
            if (existing.length === 0) {
                // Seed with a default location (e.g. base warehouse at 6.9310, 79.8450)
                await db.query(
                    "INSERT INTO distributor_profiles (user_id, status, current_lat, current_lng) VALUES (?, 'AVAILABLE', 6.9310, 79.8450)",
                    [d.id]
                );
            }
        }
        console.log('Distributor profiles seeded.');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
migrate();
