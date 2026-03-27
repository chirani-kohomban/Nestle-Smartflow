import nodemailer from "nodemailer";

import { env } from "./env";

export const mailTransporter = env.EMAIL_USER && env.EMAIL_PASSWORD
  ? nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    })
  : null;