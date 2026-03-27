import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { logger, requestLogger } from "./config/logger";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { apiRoutes } from "./routes";
import { seedDatabase } from "./services/seedService";
import { initializeDatabase } from "./utils/initializeDatabase";

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
}));
app.use(requestLogger);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.SESSION_SECRET));

app.use("/api", apiRoutes);
app.use("/api/v1", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await initializeDatabase();
    logger.info("Database initialization completed successfully");

    if (env.AUTO_SEED) {
      await seedDatabase();
      logger.info("Automatic seed completed");
    }

    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`Nestle SmartFlow backend listening on http://${env.HOST}:${env.PORT}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      logger.error(error.stack ?? error.message);
      process.exit(1);
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.stack ?? error.message : "Server startup failed");
    process.exit(1);
  }
}

void bootstrap();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    void disconnectDatabase().finally(() => process.exit(0));
  });
}