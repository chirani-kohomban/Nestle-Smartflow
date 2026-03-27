import { z } from "zod";

import { USER_ROLES } from "../types/domain";
import { emailSchema, passwordSchema, phoneSchema } from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  phone: phoneSchema,
  company: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  role: z.enum(USER_ROLES),
  termsAccepted: z.literal(true),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});