import type { Request, Response } from "express";

import { reportsService } from "../services/reportsService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const reportsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await reportsService.getReports(), "Reports retrieved successfully");
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await reportsService.getReport(req.params.id), "Report retrieved successfully");
  }),
  generate: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await reportsService.generateReport(req.body), "Report generated successfully", 201);
  }),
  export: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await reportsService.exportReport(req.body), "Report export queued successfully");
  }),
};