import { z } from "zod";

import { positivePriceSchema } from "./common";

export const productCreateSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  category: z.string().min(2),
  price: positivePriceSchema,
  description: z.string().optional(),
  barcode: z.string().optional(),
  image: z.string().optional(),
  status: z.enum(["Active", "Draft", "Seasonal"]).optional(),
  loyaltyEligible: z.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});