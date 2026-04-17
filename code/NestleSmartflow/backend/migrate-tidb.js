const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('Connecting to TiDB Cloud...');
    const pool = mysql.createPool({
        host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
        user: 'vGpb6J7VjV7NpCq.root',
        password: 'UOg4TWarIA2NAaXk',
        database: 'test',
        port: 4000,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 1,
        multipleStatements: true
    });

    try {
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema...');
        await pool.query(schemaSql);
        console.log('Schema built successfully on TiDB!');
        
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
