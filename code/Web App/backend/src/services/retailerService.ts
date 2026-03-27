import { Op } from "sequelize";

import { sequelize } from "../config/database";
import { Inventory } from "../models/Inventory";
import { InventoryItemModel } from "../models/InventoryItem";
import { POSTransaction } from "../models/POSTransaction";
import { POSTransactionItem } from "../models/POSTransactionItem";
import { Product } from "../models/Product";
import { TransactionModel } from "../models/Transaction";
import { ApiError } from "../utils/apiError";
import { memoryCache } from "../utils/cache";
import { computeDaysToStockOut, computeInventoryStatus, toRetailInventoryStatus } from "../utils/inventory";
import { buildPaginationMeta, resolvePagination } from "../utils/pagination";

const RETAIL_CACHE_PREFIX = "retailer:";
const RETAIL_CACHE_TTL_MS = 30_000;

function asId(document: any) {
  return String(document._id);
}

function mapRetailInventory(item: any) {
  const inventoryValue = item.currentStock * item.unitPrice;
  return {
    id: asId(item),
    sku: item.sku,
    productName: item.productName,
    category: item.category,
    currentStock: item.currentStock,
    reorderLevel: item.reorderLevel,
    unitPrice: item.unitPrice,
    rackLocation: item.rackLocation,
    lastUpdated: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
    location: item.location,
    status: toRetailInventoryStatus(item.status),
    inventoryValue,
  };
}

function mapRetailInventoryRow(inventory: any, product: any) {
  return mapRetailInventory({
    _id: inventory.id,
    sku: product.sku,
    productName: (inventory.payloadJson ?? {}).productName ?? product.name,
    category: (inventory.payloadJson ?? {}).category ?? product.category,
    currentStock: inventory.currentStock,
    reorderLevel: inventory.reorderLevel,
    unitPrice: Number((inventory.payloadJson ?? {}).unitPrice ?? product.price),
    rackLocation: (inventory.payloadJson ?? {}).rackLocation ?? inventory.rackLocation,
    updatedAt: inventory.updatedAt,
    location: (inventory.payloadJson ?? {}).location ?? inventory.warehouseLocation,
    status: (inventory.payloadJson ?? {}).status ?? computeInventoryStatus(inventory.currentStock, inventory.reorderLevel),
  });
}

function normalizeTransactionRow(transaction: any) {
  const payload = transaction.payloadJson ?? {};
  return {
    _id: transaction.id,
    id: transaction.id,
    createdAt: payload.createdAt ?? transaction.createdAt,
    itemsCount: payload.itemsCount ?? transaction.totalItems,
    amount: Number(payload.amount ?? transaction.totalAmount),
    method: payload.method ?? (transaction.paymentMethod === "digital_wallet" ? "Digital Wallet" : transaction.paymentMethod === "mixed" ? "Mixed Payment" : transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1)),
    status: payload.status ?? (transaction.status ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) : "Completed"),
    cashierName: payload.cashierName ?? transaction.cashierName,
    topProduct: payload.topProduct ?? transaction.topProduct,
  };
}

function invalidateRetailCache() {
  memoryCache.invalidate(RETAIL_CACHE_PREFIX);
}

export const retailerService = {
  async getDashboard() {
    const [inventory, transactions]: [any[], any[]] = await Promise.all([InventoryItemModel.find().lean(), TransactionModel.find().sort({ createdAt: -1 }).lean()]);
    return {
      metrics: [
        { id: "sales", label: "Today sales", value: `LKR ${transactions.filter((transaction) => transaction.status === "Completed").reduce((sum, transaction) => sum + transaction.amount, 0).toLocaleString()}`, description: "Completed POS transactions", icon: "banknote" },
        { id: "transactions", label: "Transactions", value: String(transactions.length), description: "Current POS activity", icon: "receipt" },
        { id: "inventory", label: "Retail stock", value: `${inventory.length} products`, description: `${inventory.filter((item) => item.status !== "In Stock").length} items need replenishment`, icon: "shelf" },
      ],
      posOverview: [
        { id: "terminal", title: "Terminal status", headline: "Online", detail: "Front counter terminal synced 2 minutes ago", tone: "good" },
        { id: "reconciliation", title: "Shift reconciliation", headline: "Balanced", detail: "No unreconciled variance detected", tone: "neutral" },
      ],
      recentSalesIds: transactions.slice(0, 5).map((transaction) => asId(transaction)),
      lowStockCount: inventory.filter((item) => item.status !== "In Stock").length,
      sessionStatus: {
        terminalId: "TERM-CO-01",
        refresh: "Every 30 seconds",
        sameOrigin: "Enabled",
        timeoutWarningMinutes: 15,
      },
    };
  },

  async getReports() {
    return {
      exportOptions: [
        { id: "pdf", label: "PDF report", format: "pdf" },
        { id: "excel", label: "Excel workbook", format: "excel" },
        { id: "csv", label: "CSV extract", format: "csv" },
        { id: "print", label: "Printable summary", format: "print" },
      ],
      generatedAt: new Date().toISOString(),
    };
  },

  async getInventory() {
    return memoryCache.getOrSet(`${RETAIL_CACHE_PREFIX}inventory`, RETAIL_CACHE_TTL_MS, async () => {
      const rows = await Inventory.findAll({ include: [{ model: Product, as: "product" }], order: [["updatedAt", "DESC"]] });
      const items = rows.map((row: any) => mapRetailInventoryRow(row, row.product));

      return {
        items,
        alerts: items.filter((item) => item.status !== "In Stock").map((item) => ({ id: item.id, type: item.status === "Out of Stock" ? "Out of Stock" : "Low Stock", title: `${item.productName} stock alert`, detail: `${item.currentStock} units available`, severity: item.status === "Low Stock" ? "warning" : "critical" })),
        reports: [
          { id: "inv-value", label: "Inventory value", value: `LKR ${items.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0).toLocaleString()}`, detail: "Current retail floor valuation" },
          { id: "reorder", label: "Reorder required", value: String(items.filter((item) => item.currentStock <= item.reorderLevel).length), detail: "Items below reorder level" },
        ],
      };
    });
  },

  async getLowStock() {
    const inventory = await this.getInventory();
    return { items: inventory.items.filter((item) => item.status !== "In Stock") };
  },

  async updateItem(id: string, payload: Record<string, unknown>) {
    const item = await InventoryItemModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!item) {
      throw new ApiError(404, "Inventory item not found", "INVENTORY_NOT_FOUND");
    }
    item.status = computeInventoryStatus(item.currentStock, item.reorderLevel);
    item.daysToStockOut = computeDaysToStockOut(item.currentStock);
    await item.save();
    invalidateRetailCache();
    return mapRetailInventory(item);
  },

  async adjust(payload: { inventoryId: string; quantityDelta: number }) {
    const item = await InventoryItemModel.findById(payload.inventoryId);
    if (!item) {
      throw new ApiError(404, "Inventory item not found", "INVENTORY_NOT_FOUND");
    }
    item.currentStock = Math.max(0, item.currentStock + payload.quantityDelta);
    item.status = computeInventoryStatus(item.currentStock, item.reorderLevel);
    item.daysToStockOut = computeDaysToStockOut(item.currentStock);
    await item.save();
    invalidateRetailCache();
    return mapRetailInventory(item);
  },

  async receive(payload: { items: Array<{ sku: string; receivedQuantity: number }> }) {
    for (const received of payload.items) {
      const item = await InventoryItemModel.findOne({ sku: received.sku });
      if (item) {
        item.currentStock += received.receivedQuantity;
        item.status = computeInventoryStatus(item.currentStock, item.reorderLevel);
        item.daysToStockOut = computeDaysToStockOut(item.currentStock);
        await item.save();
      }
    }
    invalidateRetailCache();
    return { processed: payload.items.length, completedAt: new Date().toISOString() };
  },

  async getPOSProducts() {
    return memoryCache.getOrSet(`${RETAIL_CACHE_PREFIX}pos-products`, RETAIL_CACHE_TTL_MS, async () => {
      const [inventoryRows, transactionRows] = await Promise.all([
        Inventory.findAll({ include: [{ model: Product, as: "product" }], order: [["updatedAt", "DESC"]] }),
        POSTransaction.findAll({ order: [["createdAt", "DESC"]], limit: 5 }),
      ]);

      const terminal = {
        terminalId: "TERM-CO-01",
        status: "Online",
        cashier: "Dinuka",
        store: "Colombo Retail Outlet",
        timeLabel: new Date().toLocaleTimeString(),
      };

      return {
        products: inventoryRows.map((row: any) => ({
          id: String(row.product.id),
          name: (row.payloadJson ?? {}).productName ?? row.product.name,
          sku: row.product.sku,
          category: (row.payloadJson ?? {}).category ?? row.product.category,
          price: Number((row.payloadJson ?? {}).unitPrice ?? row.product.price),
          stock: row.currentStock,
          reorderLevel: row.reorderLevel,
          image: (row.payloadJson ?? {}).image ?? row.product.image,
          barcode: (row.payloadJson ?? {}).barcode ?? row.product.barcode,
          location: (row.payloadJson ?? {}).location ?? row.warehouseLocation,
          loyaltyEligible: (row.payloadJson ?? {}).loyaltyEligible ?? Boolean(row.product.loyaltyEligible),
        })),
        terminal,
        customers: [
          { id: "cust-1", name: "Ayesha", phone: "+94 77 888 2222", loyaltyTier: "Gold", loyaltyPoints: 420 },
          { id: "cust-2", name: "Nimal", phone: "+94 77 111 3333", loyaltyTier: "Silver", loyaltyPoints: 160 },
        ],
        recentTransactions: transactionRows.map((transaction) => {
          const normalized = normalizeTransactionRow(transaction);
          return {
            id: String(normalized.id),
            createdAt: normalized.createdAt instanceof Date ? normalized.createdAt.toISOString() : String(normalized.createdAt),
            itemsCount: normalized.itemsCount,
            amount: normalized.amount,
            method: normalized.method,
            status: normalized.status,
          };
        }),
      };
    });
  },

  async checkout(payload: { items: Array<{ productId?: string; name: string; sku: string; unitPrice: number; quantity: number }>; paymentMethod: string; amountTendered: number; customerPhone?: string }, cashierUserId?: string) {
    const total = payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const change = Math.max(0, payload.amountTendered - total);

    if (payload.amountTendered < total) {
      throw new ApiError(400, "Amount tendered is less than the total", "INSUFFICIENT_PAYMENT");
    }

    const transactionId = await sequelize.transaction(async (transaction) => {
      const cashierId = Number(cashierUserId);
      const soldItems = [] as Array<{ product: any; inventory: any; quantity: number; unitPrice: number; name: string; sku: string }>;

      for (const soldItem of payload.items) {
        const lookupConditions = [] as Array<Record<string, unknown>>;
        const numericProductId = Number(soldItem.productId);
        if (Number.isInteger(numericProductId) && numericProductId > 0) {
          lookupConditions.push({ id: numericProductId });
        }
        lookupConditions.push({ sku: soldItem.sku });

        const product: any = await Product.findOne({
          where: { [Op.or]: lookupConditions },
          transaction,
        });

        if (!product) {
          throw new ApiError(404, `Product not found for SKU ${soldItem.sku}`, "PRODUCT_NOT_FOUND");
        }

        const inventory: any = await Inventory.findOne({
          where: { productId: product.id },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!inventory) {
          throw new ApiError(404, `Inventory record not found for SKU ${soldItem.sku}`, "INVENTORY_NOT_FOUND");
        }

        if (inventory.currentStock < soldItem.quantity) {
          throw new ApiError(400, `Insufficient stock for SKU ${soldItem.sku}`, "INSUFFICIENT_STOCK");
        }

        inventory.currentStock -= soldItem.quantity;
        const nextStatus = computeInventoryStatus(inventory.currentStock, inventory.reorderLevel);
        inventory.status = nextStatus === "Out of Stock" ? "out_of_stock" : nextStatus === "Low Stock" || nextStatus === "Critical" ? "low_stock" : "in_stock";
        inventory.lastStockUpdate = new Date();
        inventory.payloadJson = {
          ...(inventory.payloadJson ?? {}),
          status: nextStatus,
          currentStock: inventory.currentStock,
          daysToStockOut: computeDaysToStockOut(inventory.currentStock),
          unitPrice: Number(product.price),
        };
        await inventory.save({ transaction });

        soldItems.push({
          product,
          inventory,
          quantity: soldItem.quantity,
          unitPrice: Number(product.price),
          name: soldItem.name,
          sku: soldItem.sku,
        });
      }

      const topProduct = soldItems.slice().sort((left, right) => right.quantity - left.quantity)[0]?.name ?? "Mixed Basket";
      const posTransaction: any = await POSTransaction.create({
        transactionId: `POS-${Date.now()}`,
        cashierId: Number.isInteger(cashierId) && cashierId > 0 ? cashierId : null,
        cashierName: "Dinuka",
        storeLocation: "Colombo Retail Outlet",
        topProduct,
        totalItems: soldItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: total,
        tax: 0,
        discount: 0,
        totalAmount: total,
        paymentMethod: payload.paymentMethod.toLowerCase().replace(/\s+/g, "_") === "mixed_payment" ? "mixed" : payload.paymentMethod.toLowerCase().replace(/\s+/g, "_"),
        changeAmount: change,
        status: "completed",
        customerPhone: payload.customerPhone ?? null,
        transactionTime: new Date(),
        payloadJson: {
          items: soldItems.map((item) => ({ name: item.name, sku: item.sku, unitPrice: item.unitPrice, quantity: item.quantity })),
          itemsCount: soldItems.reduce((sum, item) => sum + item.quantity, 0),
          amount: total,
          method: payload.paymentMethod,
          status: "Completed",
          cashierName: "Dinuka",
          topProduct,
          customerPhone: payload.customerPhone,
          createdAt: new Date().toISOString(),
        },
      }, { transaction });

      await POSTransactionItem.bulkCreate(soldItems.map((item) => ({
        transactionId: posTransaction.id,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      })), { transaction });

      return posTransaction.transactionId;
    });

    invalidateRetailCache();

    return {
      transactionId,
      status: "Completed",
      total,
      change,
      receiptReference: `RCT-${Date.now()}`,
    };
  },

  async getSales(query: Record<string, unknown> = {}) {
    const { page, limit, offset } = resolvePagination(query);
    const where: Record<string, unknown> = {};

    if (typeof query.status === "string") {
      where.status = query.status.toLowerCase();
    }

    if (typeof query.paymentMethod === "string") {
      const normalizedMethod = query.paymentMethod.toLowerCase().replace(/\s+/g, "_");
      where.paymentMethod = normalizedMethod === "mixed_payment" ? "mixed" : normalizedMethod;
    }

    const [pageResult, summaryRows] = await Promise.all([
      POSTransaction.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      }),
      POSTransaction.findAll({
        where,
        attributes: ["id", "status", "paymentMethod", "totalAmount", "createdAt", "payloadJson", "totalItems", "cashierName", "topProduct"],
      }),
    ]);

    const transactions = pageResult.rows.map((transaction) => normalizeTransactionRow(transaction));
    const summarized = summaryRows.map((transaction) => normalizeTransactionRow(transaction));
    const completed = summarized.filter((transaction) => transaction.status === "Completed");
    const totalSales = completed.reduce((sum, transaction) => sum + transaction.amount, 0);
    const paymentBreakdown = ["Cash", "Card", "Digital Wallet", "Mixed Payment"].map((method) => ({ label: method, value: completed.filter((transaction) => transaction.method === method).reduce((sum, transaction) => sum + transaction.amount, 0) }));

    return {
      metrics: [
        { id: "sales-total", label: "Gross sales", value: `LKR ${totalSales.toLocaleString()}`, detail: "Completed sales volume" },
        { id: "transactions", label: "Transactions", value: String(pageResult.count), detail: "All recorded POS sessions" },
      ],
      transactions: transactions.map((transaction) => ({
        id: asId(transaction),
        dateTime: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : String(transaction.createdAt),
        totalAmount: transaction.amount,
        itemsCount: transaction.itemsCount,
        paymentMethod: transaction.method,
        cashierName: transaction.cashierName,
        status: transaction.status,
        topProduct: transaction.topProduct,
      })),
      pagination: buildPaginationMeta(pageResult.count, page, limit),
      salesTrend: completed.slice(0, 7).map((transaction, index) => ({ label: `T${index + 1}`, value: transaction.amount })),
      paymentMethodBreakdown: paymentBreakdown,
      topProductsByRevenue: [{ label: "Nestle Gold Coffee", value: 42500 }, { label: "Milk Powder 1kg", value: 31800 }, { label: "KitKat Multipack", value: 26100 }],
      topProductsByQuantity: [{ label: "Pure Life Water", value: 300 }, { label: "KitKat Multipack", value: 61 }, { label: "Chocolate Bar", value: 60 }],
      closingReport: {
        expectedCash: 18500,
        actualCash: 18500,
        cardPaymentsTotal: paymentBreakdown.find((item) => item.label === "Card")?.value ?? 0,
        digitalWalletPaymentsTotal: paymentBreakdown.find((item) => item.label === "Digital Wallet")?.value ?? 0,
        discountsGiven: 1250,
        refundsProcessed: 3200,
        openingBalance: 10000,
        closingBalance: 28500,
        variance: 0,
        reconciliationStatus: "Balanced",
      },
    };
  },

  async exportSales(format: string) {
    return {
      format,
      message: `Sales export queued in ${format.toUpperCase()} format`,
    };
  },
};