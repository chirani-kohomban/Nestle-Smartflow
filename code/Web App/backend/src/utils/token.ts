import type { Response } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env, isProduction } from "../config/env";
import type { JwtUserPayload } from "../types/domain";

const ACCESS_COOKIE = "nestle_smartflow_access";
const REFRESH_COOKIE = "nestle_smartflow_refresh";

function parseDurationToMs(input: string) {
  const unit = input.slice(-1);
  const value = Number.parseInt(input.slice(0, -1), 10);

  if (Number.isNaN(value)) {
    return 24 * 60 * 60 * 1000;
  }

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    default:
      return value * 1000;
  }
}

export function signAccessToken(payload: JwtUserPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION as SignOptions["expiresIn"] });
}

export function signRefreshToken(payload: JwtUserPayload) {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRATION as SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtUserPayload;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
  };

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...cookieOptions,
    maxAge: parseDurationToMs(env.JWT_EXPIRATION),
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: parseDurationToMs(env.REFRESH_TOKEN_EXPIRATION),
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
}

export function getAccessCookieName() {
  return ACCESS_COOKIE;
}

export function getRefreshCookieName() {
  return REFRESH_COOKIE;
}