import { z } from "zod";

import { dateStringSchema, phoneSchema, positiveIntegerSchema } from "./common";

export const proofSchema = z.object({
  id: z.string().optional(),
  photos: z.array(z.string()).optional(),
  signatureName: z.string().optional(),
  signatureCaptured: z.boolean().optional(),
  gpsConfirmed: z.boolean().optional(),
  timestamp: dateStringSchema.optional(),
  notes: z.string().optional(),
});

export const issueSchema = z.object({
  reason: z.string().min(2),
  notes: z.string().optional(),
  photoEvidence: z.array(z.string()).optional(),
});

export const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const signatureSchema = z.object({
  name: z.string().min(2),
});

export const deliveriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["Pending", "In Transit", "Delivered", "Failed", "On Hold", "Returned"]).optional(),
  routeId: z.string().min(1).optional(),
  scheduledDate: dateStringSchema.optional(),
});