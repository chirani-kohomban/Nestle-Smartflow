import type { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendError(res: Response, statusCode: number, error: string, code: string, details?: unknown) {
  return res.status(statusCode).json({ success: false, error, code, details });
}