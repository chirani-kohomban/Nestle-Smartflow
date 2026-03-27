import type { Request, Response } from "express";

import { adminService } from "../services/adminService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const adminController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminService.getDashboard(), "Admin dashboard retrieved successfully");
  }),
};