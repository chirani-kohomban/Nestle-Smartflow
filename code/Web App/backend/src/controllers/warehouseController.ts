import type { Request, Response } from "express";

import { warehouseService } from "../services/warehouseService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const warehouseController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.getDashboard());
  }),
  reports: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.getReports());
  }),
  getInventory: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.getInventoryData());
  }),
  getZones: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.getZones());
  }),
  updateInventory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.updateInventoryItem(req.params.id, req.body));
  }),
  adjustStock: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.adjustStock(req.body));
  }),
  receiveStock: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.receiveStock(req.body));
  }),
  transferStock: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.transferStock(req.body));
  }),
  cycleCount: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.completeCycleCount(req.body));
  }),
  getDispatch: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.getDispatchData());
  }),
  dispatchOrder: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.dispatchOrder(req.params.id));
  }),
  assignCarrier: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.assignCarrier(req.params.id, req.body.carrierId));
  }),
  getTracking: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.getTracking(req.params.id));
  }),
  generateLabel: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.generateLabel(req.body));
  }),
  getTasks: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.getTasksData());
  }),
  startTask: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.startTask(req.params.id));
  }),
  completeTask: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.completeTask(req.params.id));
  }),
  updateTask: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await warehouseService.updateTask(req.params.id, req.body));
  }),
};