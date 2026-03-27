import { z } from "zod";

import { USER_ROLES } from "../types/domain";
import { phoneSchema } from "./common";

export const userCreateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().max(255),
  password: z.string().min(8).max(255),
  role: z.enum(USER_ROLES),
  phone: phoneSchema.optional(),
  company: z.string().min(2).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
}).refine((data) => data.email.trim().length > 0, {
  message: "Email is required",
  path: ["email"],
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: phoneSchema.optional(),
  company: z.string().min(2).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});