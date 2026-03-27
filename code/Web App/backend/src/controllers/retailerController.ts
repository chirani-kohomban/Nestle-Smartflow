import type { Request, Response } from "express";

import { retailerService } from "../services/retailerService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const retailerController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await retailerService.getDashboard());
  }),
  reports: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await retailerService.getReports());
  }),
  inventory: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await retailerService.getInventory());
  }),
  lowStock: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await retailerService.getLowStock());
  }),
  updateInventory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await retailerService.updateItem(req.params.id, req.body));
  }),
  adjustInventory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await retailerService.adjust(req.body));
  }),
  receiveInventory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await retailerService.receive(req.body));
  }),
  products: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await retailerService.getPOSProducts());
  }),
  checkout: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await retailerService.checkout(req.body, req.user?.sub));
  }),
  sales: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await retailerService.getSales(req.query));
  }),
  exportSales: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await retailerService.exportSales(req.body.format));
  }),
};