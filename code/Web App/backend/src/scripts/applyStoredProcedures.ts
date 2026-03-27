import { readFile } from "node:fs/promises";
import path from "node:path";

import mysql from "mysql2/promise";

import { env } from "../config/env";

async function applyStoredProcedures() {
  const sqlPath = path.resolve(__dirname, "../../sql/nestle_smartflow_procedures.sql");
  const sql = await readFile(sqlPath, "utf8");
  const databaseName = env.NODE_ENV === "test" ? env.MYSQL_TEST_DATABASE : env.MYSQL_DATABASE;

  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: databaseName,
    multipleStatements: true,
  });

  try {
    await connection.query(sql.replace(/USE `[^`]+`;/g, `USE \`${databaseName}\`;`));
    console.log(`Stored procedures applied to ${databaseName}`);
  } finally {
    await connection.end();
  }
}

applyStoredProcedures().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});