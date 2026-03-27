import { disconnectDatabase } from "../config/database";
import { logger } from "../config/logger";
import { seedDatabase } from "../services/seedService";
import { initializeDatabase } from "../utils/initializeDatabase";

async function run() {
  try {
    await initializeDatabase({ reset: true });
    await seedDatabase();
    logger.info("Seed script completed successfully");
  } catch (error) {
    logger.error(error instanceof Error ? error.stack ?? error.message : "Seed script failed");
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

void run();