const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    try {
        console.log("Connecting to MySQL server...");
        // Connect to mysql server without specifying database first
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log("Creating database smartflow if it doesn't exist...");
        await connection.query('CREATE DATABASE IF NOT EXISTS smartflow;');
        await connection.query('USE smartflow;');

        console.log("Reading schema.sql...");
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing schema.sql...");
        await connection.query(schema);

        console.log("✅ Schema applied successfully.");
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("Error setting up database:", err);
        process.exit(1);
    }
}

setupDatabase();
