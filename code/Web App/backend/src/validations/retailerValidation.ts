import { z } from "zod";

import { nonNegativeIntegerSchema, paginationQuerySchema, phoneSchema, positiveIntegerSchema, positivePriceSchema } from "./common";

export const retailerInventoryUpdateSchema = z.record(z.unknown()).refine((value) => Object.keys(value).length > 0, {
  message: "At least one property is required",
});

export const retailerAdjustSchema = z.object({
  inventoryId: z.string().min(1),
  quantityDelta: z.number().int(),
  reason: z.string().min(2),
});

export const retailerReceiveSchema = z.object({
  supplierName: z.string().min(2),
  invoiceNumber: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    sku: z.string().min(1),
    expectedQuantity: nonNegativeIntegerSchema,
    receivedQuantity: nonNegativeIntegerSchema,
  })).min(1),
});

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    name: z.string().min(1),
    sku: z.string().min(1),
    unitPrice: positivePriceSchema,
    quantity: positiveIntegerSchema,
    stock: nonNegativeIntegerSchema,
  })).min(1),
  paymentMethod: z.enum(["Cash", "Card", "Digital Wallet", "Mixed Payment"]),
  amountTendered: positivePriceSchema,
  discountCode: z.string().optional(),
  customerId: z.string().optional(),
  splitBill: z.boolean().optional(),
  customerPhone: phoneSchema.optional(),
});

export const exportSalesSchema = z.object({
  format: z.string().min(2),
});

export const salesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["Completed", "Pending", "Cancelled", "Refunded"]).optional(),
  paymentMethod: z.enum(["Cash", "Card", "Digital Wallet", "Mixed Payment"]).optional(),
});