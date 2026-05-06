const db = require('./backend/db');
async function fix() {
    const warehouseHash = "$2b$10$kCRdBJZY/RH9iUtZ5MlAZuJv.yxy90D1yJaHQ5cl98bx8GpzeuzCu";
    await db.query("UPDATE users SET password_hash = ? WHERE role = 'DISTRIBUTOR'", [warehouseHash]);
    console.log("Distributor passwords fixed!");
    process.exit(0);
}
fix();
