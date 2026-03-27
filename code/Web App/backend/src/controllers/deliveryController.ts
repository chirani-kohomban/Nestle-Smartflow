import type { Request, Response } from "express";

import { deliveryService } from "../services/deliveryService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const deliveryController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getDashboard());
  }),
  getDeliveries: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getDeliveriesData(req.query));
  }),
  getDelivery: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getDelivery(req.params.id));
  }),
  completeDelivery: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.completeDelivery(req.params.id, req.user?.sub));
  }),
  uploadProof: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.uploadProof(req.params.id, req.body));
  }),
  reportIssue: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.reportIssue(req.params.id, req.body));
  }),
  getRoutes: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getRoutesData());
  }),
  getRoute: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getRoute(req.params.id));
  }),
  startRoute: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.startRoute(req.params.id));
  }),
  endRoute: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.endRoute(req.params.id));
  }),
  optimizeRoute: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.optimizeRoute(req.params.id));
  }),
  earnings: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getEarnings());
  }),
  earningsByPeriod: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getEarnings(req.params.period));
  }),
  trackLocation: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.trackLocation(req.body.latitude, req.body.longitude));
  }),
  navigation: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.getNavigation());
  }),
  signature: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await deliveryService.captureSignature(req.body.name));
  }),
};