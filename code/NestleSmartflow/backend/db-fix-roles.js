const db = require('./db.js');
(async () => {
    try {
        console.log('1. Setting safe sql_mode...');
        await db.query(`SET sql_mode = ""`);
        
        console.log('2. Updating ENUM definition...');
        await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('MANAGER', 'NESTLE_MANAGER', 'AREA_MANAGER', 'ADMIN', 'WAREHOUSE', 'DISTRIBUTOR') NOT NULL DEFAULT 'AREA_MANAGER'`);
        
        console.log('3. Repairing broken user roles...');
        await db.query(`UPDATE users SET role = 'NESTLE_MANAGER' WHERE username = 'nestle_manager'`);
        await db.query(`UPDATE users SET role = 'AREA_MANAGER' WHERE username LIKE 'area_manager%'`);
        await db.query(`UPDATE users SET role = 'ADMIN' WHERE username = 'admin'`);
        await db.query(`UPDATE users SET role = 'AREA_MANAGER' WHERE role = ''`);
        
        const [rows] = await db.query('SELECT id, username, role FROM users');
        console.table(rows);
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
})();
