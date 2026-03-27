import type { Request, Response } from "express";

import type { AuthenticatedUser } from "../types/domain";
import { authService } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";
import { clearAuthCookies, getRefreshCookieName, setAuthCookies } from "../utils/token";

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ success: true, data: { user: result.user, token: result.accessToken }, message: "Login successful" });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    await authService.register(req.body);
    res.status(201).json({ success: true, data: { user: null }, message: "Registration successful. Await account verification." });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.cookies?.[getRefreshCookieName()]);
    clearAuthCookies(res);
    res.status(200).json({ success: true, data: { user: null }, message: "Logout successful" });
  }),

  currentUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.sub);
    res.status(200).json({ success: true, data: { user }, message: "Current user retrieved" });
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[getRefreshCookieName()];
    const result = await authService.refresh(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ success: true, data: { user: result.user, token: result.accessToken }, message: "Session refreshed" });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ success: true, data: { user: null }, message: "If the account exists, a reset email has been sent." });
  }),
};