const db = require('./backend/db');
async function check() {
    const [rows] = await db.query("SELECT id, username, role FROM users");
    console.table(rows);
    process.exit(0);
}
check();
