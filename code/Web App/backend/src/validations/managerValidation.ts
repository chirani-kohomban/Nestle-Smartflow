import { z } from "zod";

import { ORDER_PRIORITIES, ORDER_STATUSES } from "../types/domain";
import { dateStringSchema, emailSchema, paginationQuerySchema, phoneSchema, positiveIntegerSchema, positivePriceSchema } from "./common";

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  assignedTo: z.string().min(1).optional(),
  priority: z.enum(ORDER_PRIORITIES).optional(),
  notes: z.array(z.string().min(1)).optional(),
});

export const exportReportSchema = z.object({
  format: z.enum(["pdf", "excel", "csv"]),
});

export const ordersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  priority: z.enum(ORDER_PRIORITIES).optional(),
  search: z.string().min(1).optional(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  region: z.string().min(2),
  store: z.string().min(2),
  priority: z.enum(ORDER_PRIORITIES),
  assignedTo: z.string().min(1),
  deliveryAddress: z.string().min(5),
  deliveryCity: z.string().min(2),
  deliveryZone: z.string().min(2),
  preferredDeliveryWindow: z.string().min(3),
  preferredDeliveryDate: dateStringSchema.optional(),
  deliveryInstructions: z.string().optional(),
  paymentMethod: z.enum(["Cash", "Card", "Digital Wallet", "Mixed Payment"]),
  paymentStatus: z.enum(["Pending", "Completed", "Failed", "Refunded", "Authorized", "Paid"]).optional(),
  promoCode: z.string().optional(),
  items: z.array(z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    image: z.string().optional(),
    quantity: positiveIntegerSchema,
    unitPrice: positivePriceSchema,
    notes: z.string().optional(),
  })).min(1),
  tax: positivePriceSchema.optional(),
  shippingCost: positivePriceSchema.optional(),
  discount: z.number().min(0).optional(),
});