import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default("localhost"),
  MYSQL_HOST: z.string().default("localhost"),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().default(""),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_TEST_DATABASE: z.string().min(1),
  MYSQL_ROOT_PASSWORD: z.string().default(""),
  MYSQL_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MYSQL_SLOW_QUERY_MS: z.coerce.number().int().positive().default(750),
  MYSQL_POOL_MIN: z.coerce.number().int().nonnegative().default(0),
  MYSQL_POOL_MAX: z.coerce.number().int().positive().default(10),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRATION: z.string().default("24h"),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_EXPIRATION: z.string().default("7d"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  EMAIL_SERVICE: z.string().default("gmail"),
  EMAIL_USER: z.string().optional().default(""),
  EMAIL_PASSWORD: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("noreply@nestlesmartflow.com"),
  LOG_LEVEL: z.string().default("info"),
  SESSION_SECRET: z.string().min(10),
  AUTO_SEED: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";