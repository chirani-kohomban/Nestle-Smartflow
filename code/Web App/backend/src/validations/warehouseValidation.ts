import { z } from "zod";

import { TASK_PRIORITIES, TASK_STATUSES } from "../types/domain";
import { dateStringSchema, nonNegativeIntegerSchema, positiveIntegerSchema, positivePriceSchema } from "./common";

export const inventoryUpdateSchema = z.object({
  productName: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  currentStock: nonNegativeIntegerSchema.optional(),
  reorderLevel: nonNegativeIntegerSchema.optional(),
  zone: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  rackLocation: z.string().min(1).optional(),
  unitPrice: positivePriceSchema.optional(),
  expiryDate: dateStringSchema.optional(),
});

export const stockAdjustmentSchema = z.object({
  inventoryId: z.string().min(1),
  adjustmentType: z.enum(["Add", "Remove"]),
  quantity: positiveIntegerSchema,
  reason: z.string().min(2),
  notes: z.string().optional(),
  approvalRequired: z.boolean().optional(),
});

export const receiveStockSchema = z.object({
  supplierName: z.string().min(2),
  purchaseOrderNumber: z.string().min(1),
  receivingDock: z.string().min(1),
  items: z.array(z.object({
    sku: z.string().min(1),
    expectedQuantity: nonNegativeIntegerSchema,
    receivedQuantity: nonNegativeIntegerSchema,
    rackLocation: z.string().min(1),
    notes: z.string().optional(),
  })).min(1),
});

export const transferStockSchema = z.object({
  inventoryId: z.string().min(1),
  sourceZone: z.string().min(1),
  destinationZone: z.string().min(1),
  quantity: positiveIntegerSchema,
  reason: z.string().min(2),
});

export const cycleCountSchema = z.object({
  zone: z.string().min(1),
  items: z.array(z.object({
    sku: z.string().min(1),
    expectedQuantity: nonNegativeIntegerSchema,
    scannedQuantity: nonNegativeIntegerSchema,
  })).min(1),
});

export const taskUpdateSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  assignee: z.string().min(1).optional(),
  progress: z.number().min(0).max(100).optional(),
  description: z.string().min(2).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export const assignCarrierSchema = z.object({
  carrierId: z.string().min(1),
});

export const generateLabelSchema = z.object({
  orderId: z.string().min(1),
  carrierId: z.string().min(1),
});