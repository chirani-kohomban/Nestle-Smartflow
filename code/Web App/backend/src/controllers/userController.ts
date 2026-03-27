import type { Request, Response } from "express";

import { userService } from "../services/userService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await userService.getUsers(req.query.role as string | undefined), "Users retrieved successfully");
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await userService.getUser(req.params.id), "User retrieved successfully");
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await userService.createUser(req.body), "User created successfully");
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await userService.updateUser(req.params.id, req.body), "User updated successfully");
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await userService.deleteUser(req.params.id), "User deleted successfully");
  }),
};