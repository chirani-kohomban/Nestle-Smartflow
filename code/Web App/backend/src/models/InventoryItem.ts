import { Sequelize } from "sequelize";

import { attachDocument, inventoryStatusFromDatabase, inventoryStatusToDatabase, ManyRecordQuery, SingleRecordQuery } from "./compat";
import { Inventory, initInventoryModel } from "./Inventory";
import { Product, initProductModel } from "./Product";

export function initInventoryItemModels(sequelize: Sequelize) {
  initProductModel(sequelize);
  initInventoryModel(sequelize);
}

function withChildIds<T extends Record<string, unknown>>(items: T[] | undefined, prefix: string) {
  return (items ?? []).map((item, index) => ({ _id: `${prefix}-${index + 1}`, ...item }));
}

function toPlain(inventory: any, product: any) {
  const payload = inventory.payloadJson ?? {};
  return {
    ...payload,
    _id: inventory.id,
    id: inventory.id,
    sku: product.sku,
    productName: payload.productName ?? product.name,
    category: payload.category ?? product.category,
    currentStock: inventory.currentStock,
    reorderLevel: inventory.reorderLevel,
    zone: payload.zone ?? inventory.warehouseLocation,
    location: payload.location ?? inventory.warehouseLocation,
    rackLocation: payload.rackLocation ?? inventory.rackLocation,
    status: payload.status ?? inventoryStatusFromDatabase(inventory.status),
    daysToStockOut: payload.daysToStockOut ?? 0,
    unitPrice: Number(payload.unitPrice ?? product.price),
    expiryDate: payload.expiryDate ?? product.expiryDate,
    barcode: payload.barcode ?? product.barcode,
    image: payload.image ?? product.image,
    loyaltyEligible: payload.loyaltyEligible ?? Boolean(product.loyaltyEligible),
    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
  };
}

function toDocument(inventory: any, product: any) {
  const document = attachDocument(toPlain(inventory, product), inventory.id, async () => {
    product.sku = document.sku;
    product.name = document.productName;
    product.category = document.category;
    product.price = document.unitPrice;
    product.expiryDate = document.expiryDate ?? null;
    product.barcode = document.barcode ?? null;
    product.image = document.image ?? null;
    product.loyaltyEligible = Boolean(document.loyaltyEligible);
    inventory.currentStock = document.currentStock;
    inventory.reorderLevel = document.reorderLevel;
    inventory.warehouseLocation = document.zone ?? document.location;
    inventory.rackLocation = document.rackLocation ?? null;
    inventory.status = inventoryStatusToDatabase(document.status);
    inventory.payloadJson = {
      ...document,
      status: document.status,
      productName: document.productName,
      category: document.category,
      location: document.location,
      zone: document.zone,
      rackLocation: document.rackLocation,
      daysToStockOut: document.daysToStockOut,
      unitPrice: document.unitPrice,
      expiryDate: document.expiryDate,
      barcode: document.barcode,
      image: document.image,
      loyaltyEligible: document.loyaltyEligible,
    };
    await product.save();
    await inventory.save();
  });

  return document;
}

async function fetchRows(where: Record<string, unknown> = {}) {
  const include = [{ model: Product, as: "product" }];
  const productWhere: Record<string, unknown> = {};
  const inventoryWhere: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(where)) {
    if (["sku", "productName", "category"].includes(key)) {
      productWhere[key === "productName" ? "name" : key] = value;
    } else if (key === "zone") {
      inventoryWhere.warehouseLocation = value;
    } else if (key === "status") {
      inventoryWhere.status = inventoryStatusToDatabase(String(value));
    } else if (key === "_id") {
      inventoryWhere.id = value;
    }
  }

  return Inventory.findAll({ where: inventoryWhere, include: [{ model: Product, as: "product", where: Object.keys(productWhere).length > 0 ? productWhere : undefined }] });
}

export const InventoryItemModel: any = {
  countDocuments() {
    return Inventory.count();
  },

  async insertMany(items: Record<string, unknown>[]) {
    const created = [];
    for (const item of items) {
      created.push(await InventoryItemModel.create(item));
    }
    return created;
  },

  async create(item: Record<string, unknown>) {
    const product = await Product.create({
      sku: item.sku,
      name: item.productName,
      category: item.category,
      price: item.unitPrice,
      expiryDate: item.expiryDate ?? null,
      barcode: item.barcode ?? null,
      image: item.image ?? null,
      loyaltyEligible: item.loyaltyEligible ?? true,
    });
    const inventory = await Inventory.create({
      productId: product.id,
      warehouseLocation: item.zone ?? item.location,
      rackLocation: item.rackLocation ?? null,
      currentStock: item.currentStock ?? 0,
      reorderLevel: item.reorderLevel ?? 0,
      status: inventoryStatusToDatabase(String(item.status ?? "In Stock")),
      payloadJson: { ...item },
    });
    return toDocument(inventory, product);
  },

  find(where: Record<string, unknown> = {}) {
    return new ManyRecordQuery(async ({ sort, limit }, lean) => {
      let rows = await fetchRows(where);
      if (sort) {
        const [sortKey, direction] = Object.entries(sort)[0] ?? [];
        rows = rows.sort((left: any, right: any) => {
          const leftPlain = toPlain(left, left.product);
          const rightPlain = toPlain(right, right.product);
          const leftValue = leftPlain[sortKey as keyof typeof leftPlain];
          const rightValue = rightPlain[sortKey as keyof typeof rightPlain];
          if (leftValue === rightValue) {
            return 0;
          }
          return leftValue > rightValue ? Number(direction) : -Number(direction);
        });
      }
      if (typeof limit === "number") {
        rows = rows.slice(0, limit);
      }
      return rows.map((row: any) => (lean ? toPlain(row, row.product) : toDocument(row, row.product)));
    });
  },

  findOne(where: Record<string, unknown>) {
    return new SingleRecordQuery(async (lean) => {
      const [row] = await fetchRows(where);
      return row ? (lean ? toPlain(row, (row as any).product) : toDocument(row, (row as any).product)) : null;
    });
  },

  findById(id: string | number) {
    return new SingleRecordQuery(async (lean) => {
      const row = await Inventory.findByPk(id, { include: [{ model: Product, as: "product" }] });
      return row ? (lean ? toPlain(row, (row as any).product) : toDocument(row, (row as any).product)) : null;
    });
  },

  findByIdAndUpdate(id: string | number, payload: Record<string, unknown>, _options?: Record<string, unknown>) {
    return Inventory.findByPk(id, { include: [{ model: Product, as: "product" }] }).then(async (row: any) => {
      if (!row) {
        return null;
      }
      const document = toDocument(row, row.product);
      Object.assign(document, payload);
      await document.save();
      return document;
    });
  },
};