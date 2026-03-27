import type { Request, Response } from "express";

import { productService } from "../services/productService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const productController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await productService.getProducts({ category: req.query.category as string | undefined, search: req.query.search as string | undefined }), "Products retrieved successfully");
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await productService.getProduct(req.params.id), "Product retrieved successfully");
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await productService.createProduct(req.body), "Product created successfully", 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await productService.updateProduct(req.params.id, req.body), "Product updated successfully");
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await productService.deleteProduct(req.params.id), "Product deleted successfully");
  }),
  byCategory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await productService.getProductsByCategory(req.params.category), "Products retrieved successfully");
  }),
};