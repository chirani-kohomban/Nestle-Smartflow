import { Op } from "sequelize";

import { Product } from "../models/Product";
import { ApiError } from "../utils/apiError";

function mapDemand(product: any) {
  const price = Number(product.price ?? 0);
  if (!product.isActive) {
    return "Dormant";
  }
  if (price >= 2500) {
    return "Premium";
  }
  if (price >= 1000) {
    return "High";
  }
  return "Steady";
}

function serializeProduct(product: any) {
  return {
    id: String(product.id),
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: Number(product.price),
    status: product.isActive ? "Active" : "Draft",
    demand: mapDemand(product),
    description: product.description,
    barcode: product.barcode,
    image: product.image,
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : String(product.createdAt),
  };
}

export const productService = {
  async getProducts(filters: { category?: string; search?: string } = {}) {
    const where: Record<string | symbol, unknown> = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { sku: { [Op.like]: `%${filters.search}%` } },
        { category: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const rows = await Product.findAll({ where, order: [["updatedAt", "DESC"]] });
    return rows.map(serializeProduct);
  },

  async getProduct(id: string) {
    const product: any = await Product.findByPk(id);
    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
    return serializeProduct(product);
  },

  async createProduct(payload: Record<string, unknown>) {
    const product: any = await Product.create({
      sku: payload.sku,
      name: payload.name,
      category: payload.category,
      description: payload.description ?? null,
      price: payload.price,
      image: payload.image ?? null,
      barcode: payload.barcode ?? null,
      loyaltyEligible: Boolean(payload.loyaltyEligible ?? true),
      isActive: String(payload.status ?? "Active") !== "Draft",
    });

    return serializeProduct(product);
  },

  async updateProduct(id: string, payload: Record<string, unknown>) {
    const product: any = await Product.findByPk(id);
    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    if (payload.name !== undefined) product.name = payload.name;
    if (payload.sku !== undefined) product.sku = payload.sku;
    if (payload.category !== undefined) product.category = payload.category;
    if (payload.description !== undefined) product.description = payload.description;
    if (payload.price !== undefined) product.price = payload.price;
    if (payload.image !== undefined) product.image = payload.image;
    if (payload.barcode !== undefined) product.barcode = payload.barcode;
    if (payload.status !== undefined) product.isActive = String(payload.status) !== "Draft";

    await product.save();
    return serializeProduct(product);
  },

  async deleteProduct(id: string) {
    const product: any = await Product.findByPk(id);
    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    product.isActive = false;
    await product.save();
    return { id: String(product.id), deleted: true };
  },

  async getProductsByCategory(category: string) {
    return this.getProducts({ category });
  },
};