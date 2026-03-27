import { readFile } from "node:fs/promises";
import path from "node:path";

import mysql from "mysql2/promise";
import { Sequelize } from "sequelize";

import { env } from "./env";
import { logger } from "./logger";
import { initializeModels } from "../models";

const databaseName = env.NODE_ENV === "test" ? env.MYSQL_TEST_DATABASE : env.MYSQL_DATABASE;

export const sequelize = new Sequelize(databaseName, env.MYSQL_USER, env.MYSQL_PASSWORD, {
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  dialect: "mysql",
  benchmark: true,
  logging: (sql, timing) => {
    const duration = typeof timing === "number" ? timing : 0;
    if (duration >= env.MYSQL_SLOW_QUERY_MS) {
      logger.warn(`Slow query detected (${duration}ms): ${sql}`);
      return;
    }

    logger.debug(`SQL (${duration}ms): ${sql}`);
  },
  pool: {
    min: env.MYSQL_POOL_MIN,
    max: env.MYSQL_POOL_MAX,
    idle: 10000,
    acquire: env.MYSQL_CONNECT_TIMEOUT_MS,
  },
  dialectOptions: {
    connectTimeout: env.MYSQL_CONNECT_TIMEOUT_MS,
  },
  define: {
    freezeTableName: true,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
});

let initialized = false;

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
}

async function applySqlSchema(reset = false) {
  const schemaPath = path.resolve(__dirname, "../../sql/nestle_smartflow_mysql.sql");
  const rawSchema = await readFile(schemaPath, "utf8");
  const normalizedSchema = reset
    ? rawSchema
    : rawSchema.replace(/SET FOREIGN_KEY_CHECKS = 0;[\s\S]*?SET FOREIGN_KEY_CHECKS = 1;\s*/m, "");
  const schema = normalizedSchema
    .replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`/g, `CREATE DATABASE IF NOT EXISTS \`${databaseName}\``)
    .replace(/USE `[^`]+`;/g, `USE \`${databaseName}\`;`);

  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    multipleStatements: true,
  });

  try {
    await connection.query(schema);
  } finally {
    await connection.end();
  }
}

export async function connectDatabase() {
  if (!initialized) {
    await ensureDatabaseExists();
    initializeModels(sequelize);
    initialized = true;
  }

  await sequelize.authenticate();
  logger.info(`MySQL connected to ${databaseName} at ${env.MYSQL_HOST}:${env.MYSQL_PORT}`);
}

export async function syncDatabase(reset = false) {
  if (!initialized) {
    await connectDatabase();
  }

  await applySqlSchema(reset);
  logger.info("MySQL schema applied from sql/nestle_smartflow_mysql.sql");
}

export async function disconnectDatabase() {
  await sequelize.close();
  logger.info("MySQL disconnected");
}