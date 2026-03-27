import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedUser, UserRole } from "../types/domain";
import { ApiError } from "../utils/apiError";
import { getAccessCookieName, verifyAccessToken } from "../utils/token";

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

function extractToken(req: Request) {
  const cookieToken = req.cookies?.[getAccessCookieName()];
  if (cookieToken) {
    return cookieToken as string;
  }

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    next(new ApiError(401, "Authentication required", "AUTH_REQUIRED"));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "Insufficient permissions", "FORBIDDEN"));
      return;
    }

    next();
  };
}