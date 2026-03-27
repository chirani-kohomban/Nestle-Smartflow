import type { Request, Response } from "express";

import { sendError } from "../utils/response";

export function notFoundHandler(req: Request, res: Response) {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND");
}