import type { Request, Response } from "express";

import { managerService } from "../services/managerService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const managerController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await managerService.getDashboard());
  }),
  getOrders: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await managerService.getOrdersData(req.query));
  }),
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await managerService.createOrder(req.body));
  }),
  getOrder: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await managerService.getOrder(req.params.id));
  }),
  updateOrder: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await managerService.updateOrder(req.params.id, req.body));
  }),
  escalateOrder: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await managerService.escalateOrder(req.params.id));
  }),
  reports: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await managerService.getReports());
  }),
  exportReport: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await managerService.exportReport(req.body.format));
  }),
  salesAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await managerService.getSalesAnalytics());
  }),
  inventoryAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await managerService.getInventoryAnalytics());
  }),
  orderAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await managerService.getOrderAnalytics());
  }),
  comparativeAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await managerService.getComparativeAnalytics());
  }),
  alerts: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await managerService.getAlerts());
  }),
};