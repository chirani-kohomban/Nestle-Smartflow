import type { NextFunction, Request, Response } from "express";
import { DatabaseError, ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from "sequelize";
import { ZodError } from "zod";

import { logger } from "../config/logger";
import { ApiError } from "../utils/apiError";
import { sendError } from "../utils/response";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  logger.error(error instanceof Error ? error.stack ?? error.message : "Unknown error");

  if (error instanceof ApiError) {
    sendError(res, error.statusCode, error.message, error.code, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendError(res, 400, "Validation failed", "VALIDATION_ERROR", error.flatten());
    return;
  }

  if (error instanceof ValidationError) {
    sendError(res, 400, "Database validation failed", "DATABASE_VALIDATION_ERROR", error.errors.map((entry) => entry.message));
    return;
  }

  if (error instanceof UniqueConstraintError) {
    sendError(res, 409, "A record with the same unique value already exists", "DUPLICATE_RECORD");
    return;
  }

  if (error instanceof ForeignKeyConstraintError) {
    sendError(res, 409, "The requested operation conflicts with related records", "FOREIGN_KEY_CONSTRAINT");
    return;
  }

  if (error instanceof DatabaseError) {
    sendError(res, 500, "Database operation failed", "DATABASE_ERROR");
    return;
  }

  sendError(res, 500, "Internal server error", "INTERNAL_SERVER_ERROR");
}