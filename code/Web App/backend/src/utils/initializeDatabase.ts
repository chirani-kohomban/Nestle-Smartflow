import { connectDatabase, syncDatabase } from "../config/database";
import { logger } from "../config/logger";

export async function initializeDatabase(options?: { reset?: boolean }) {
  await connectDatabase();
  await syncDatabase(options?.reset ?? false);
  logger.info("Database initialization completed");
}