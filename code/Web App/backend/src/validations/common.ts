import { z } from "zod";

const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[0-9\s-]{6,18}$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const emailSchema = z.string().trim().email("Enter a valid email address").toLowerCase();

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(
  strongPasswordRegex,
  "Password must include uppercase, lowercase, and a number",
);

export const phoneSchema = z.string().trim().regex(phoneRegex, "Enter a valid phone number");

export const positivePriceSchema = z.number().positive("Value must be a positive price");

export const positiveIntegerSchema = z.number().int("Value must be an integer").positive("Value must be greater than zero");

export const nonNegativeIntegerSchema = z.number().int("Value must be an integer").nonnegative("Value must be zero or greater");

export const dateStringSchema = z.string().trim().refine((value) => {
  if (!isoDateRegex.test(value) && Number.isNaN(Date.parse(value))) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}, "Enter a valid date");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().trim().optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;