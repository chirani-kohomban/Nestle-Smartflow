import morgan from "morgan";
import winston from "winston";

import { env, isProduction } from "./env";

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "nestle-smartflow-backend" },
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

export const requestLogger = morgan("combined", {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
});