import { attachDocument, ManyRecordQuery, SingleRecordQuery } from "./compat";
import { POSTransaction } from "./POSTransaction";

function paymentMethodToDatabase(method?: string | null) {
  const normalized = String(method ?? "Cash").toLowerCase().replace(/\s+/g, "_");
  return normalized === "digital_wallet" ? normalized : normalized === "mixed_payment" ? "mixed" : normalized;
}

function paymentMethodFromDatabase(method?: string | null) {
  if (!method) {
    return "Cash";
  }
  if (method === "digital_wallet") {
    return "Digital Wallet";
  }
  if (method === "mixed") {
    return "Mixed Payment";
  }
  return method.charAt(0).toUpperCase() + method.slice(1);
}

function transactionStatusToDatabase(status?: string | null) {
  const map: Record<string, string> = { Completed: "completed", Held: "pending", Cancelled: "cancelled", Refunded: "refunded", Pending: "pending" };
  return status ? map[status] ?? status.toLowerCase() : "completed";
}

function transactionStatusFromDatabase(status?: string | null) {
  const map: Record<string, string> = { completed: "Completed", pending: "Pending", cancelled: "Cancelled", refunded: "Refunded" };
  return status ? map[status] ?? status : "Completed";
}

function toPlain(instance: any) {
  const payload = instance.payloadJson ?? {};
  return {
    ...payload,
    _id: instance.id,
    id: instance.id,
    itemsCount: payload.itemsCount ?? instance.totalItems,
    amount: Number(payload.amount ?? instance.totalAmount),
    method: payload.method ?? paymentMethodFromDatabase(instance.paymentMethod),
    status: payload.status ?? transactionStatusFromDatabase(instance.status),
    cashierName: payload.cashierName ?? instance.cashierName,
    topProduct: payload.topProduct ?? instance.topProduct,
    createdAt: instance.createdAt,
    updatedAt: instance.createdAt,
  };
}

function toDocument(instance: any) {
  const document = attachDocument(toPlain(instance), instance.id, async () => {
    instance.totalItems = document.itemsCount;
    instance.totalAmount = document.amount;
    instance.subtotal = document.amount;
    instance.paymentMethod = paymentMethodToDatabase(document.method);
    instance.status = transactionStatusToDatabase(document.status);
    instance.cashierName = document.cashierName ?? "Dinuka";
    instance.topProduct = document.topProduct ?? null;
    instance.payloadJson = { ...document };
    await instance.save();
  });
  return document;
}

export const TransactionModel = {
  countDocuments() {
    return POSTransaction.count();
  },

  async insertMany(items: Record<string, unknown>[]) {
    const created = [];
    for (const item of items) {
      created.push(await TransactionModel.create(item));
    }
    return created;
  },

  async create(item: Record<string, unknown>) {
    const instance = await POSTransaction.create({
      transactionId: item.transactionId ?? `POS-${Date.now()}`,
      cashierName: item.cashierName ?? "Dinuka",
      storeLocation: item.storeLocation ?? "Colombo Retail Outlet",
      topProduct: item.topProduct ?? null,
      totalItems: item.itemsCount ?? 0,
      subtotal: item.amount ?? 0,
      totalAmount: item.amount ?? 0,
      paymentMethod: paymentMethodToDatabase(String(item.method ?? "Cash")),
      status: transactionStatusToDatabase(String(item.status ?? "Completed")),
      payloadJson: { ...item },
    });
    return toDocument(instance);
  },

  find(where: Record<string, unknown> = {}) {
    return new ManyRecordQuery(async ({ sort, limit }, lean) => {
      const rows = await POSTransaction.findAll({
        where: Object.fromEntries(Object.entries(where).map(([key, value]) => [key === "_id" ? "id" : key === "method" ? "paymentMethod" : key, key === "method" ? paymentMethodToDatabase(String(value)) : key === "status" ? transactionStatusToDatabase(String(value)) : value])),
        order: sort ? Object.entries(sort).map(([key, direction]) => [key === "createdAt" ? "createdAt" : key, direction === -1 ? "DESC" : "ASC"]) : undefined,
        limit,
      });
      return rows.map((row) => (lean ? toPlain(row) : toDocument(row)));
    });
  },

  findOne(where: Record<string, unknown>) {
    return new SingleRecordQuery(async (lean) => {
      const row = await POSTransaction.findOne({ where: Object.fromEntries(Object.entries(where).map(([key, value]) => [key === "_id" ? "id" : key, key === "method" ? paymentMethodToDatabase(String(value)) : key === "status" ? transactionStatusToDatabase(String(value)) : value])) });
      return row ? (lean ? toPlain(row) : toDocument(row)) : null;
    });
  },

  findById(id: string | number) {
    return new SingleRecordQuery(async (lean) => {
      const row = await POSTransaction.findByPk(id);
      return row ? (lean ? toPlain(row) : toDocument(row)) : null;
    });
  },
};