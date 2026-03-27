import { z } from "zod";

export const generateReportSchema = z.object({
  title: z.string().min(2).optional(),
  type: z.string().min(2),
  dateRange: z.object({
    start: z.string().min(4),
    end: z.string().min(4),
  }).optional(),
  filters: z.record(z.unknown()).optional(),
});

export const exportReportSchema = z.object({
  reportId: z.string().optional(),
  format: z.enum(["pdf", "excel", "csv"]),
});