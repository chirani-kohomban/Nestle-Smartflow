import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const healthController = {
  health: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, {
      status: "ok",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }),
};