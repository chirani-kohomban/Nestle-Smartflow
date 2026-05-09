const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

// Create a connection pool to MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    user: process.env.DB_USER || 'vGpb6J7VjV7NpCq.root',
    password: process.env.DB_PASSWORD || 'UOg4TWarIA2NAaXk',
    database: process.env.DB_NAME || 'test',
    port: process.env.DB_PORT || 4000,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
