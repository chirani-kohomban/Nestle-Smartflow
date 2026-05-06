const db = require('./backend/db');
async function test() {
    const [rows] = await db.query("SELECT * FROM users WHERE username = 'shop_kandy'");
    console.log(rows);
    process.exit(0);
}
test();
