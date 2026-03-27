import bcrypt from "bcryptjs";

import { mailTransporter } from "../config/mailer";
import { UserModel } from "../models/User";
import type { JwtUserPayload } from "../types/domain";
import { ApiError } from "../utils/apiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token";

function serializeUser(user: any) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    company: user.company,
    address: user.address,
    city: user.city,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
  };
}

function toPayload(user: any): JwtUserPayload {
  return {
    sub: String(user._id),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    company: user.company,
    phone: user.phone,
  };
}

export const authService = {
  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const payload = toPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokens = [...(user.refreshTokens ?? []), refreshToken];
    await user.save();

    return {
      user: serializeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async register(input: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    company: string;
    address?: string;
    city?: string;
    role: string;
  }) {
    const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "User already exists", "USER_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await UserModel.create({
      ...input,
      email: input.email.toLowerCase(),
      passwordHash,
      emailVerified: false,
    });

    return serializeUser(user);
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    await UserModel.updateOne({ refreshTokens: refreshToken }, { $pull: { refreshTokens: refreshToken } });
  },

  async getCurrentUser(userId: string) {
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    return serializeUser(user);
  },

  async refresh(refreshToken: string) {
    let payload: JwtUserPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }

    const user = await UserModel.findOne({ _id: payload.sub, refreshTokens: refreshToken });
    if (!user) {
      throw new ApiError(401, "Refresh token is no longer valid", "REFRESH_TOKEN_REVOKED");
    }

    const nextPayload = toPayload(user);
    const accessToken = signAccessToken(nextPayload);
    const nextRefreshToken = signRefreshToken(nextPayload);

    user.refreshTokens = (user.refreshTokens ?? []).filter((token: string) => token !== refreshToken);
    user.refreshTokens.push(nextRefreshToken);
    await user.save();

    return {
      user: serializeUser(user),
      accessToken,
      refreshToken: nextRefreshToken,
    };
  },

  async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (user && mailTransporter) {
      await mailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Nestle SmartFlow password reset request",
        text: "A password reset was requested for your account. This backend currently provides the notification flow placeholder only.",
      });
    }

    return true;
  },
};