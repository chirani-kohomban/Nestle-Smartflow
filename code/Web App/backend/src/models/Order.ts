import { DataTypes, Model, Sequelize } from "sequelize";

import { attachDocument, ManyRecordQuery, orderStatusFromDatabase, orderStatusToDatabase, SingleRecordQuery } from "./compat";
import { OrderItem } from "./OrderItem";
import { Product } from "./Product";
import { User } from "./User";

export class Order extends Model {
  declare id: number;
}

export function initOrderModel(sequelize: Sequelize) {
  if (sequelize.models.Order) {
    return sequelize.models.Order as typeof Order;
  }

  Order.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      orderId: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      customerName: { type: DataTypes.STRING(255), allowNull: true },
      customerEmail: { type: DataTypes.STRING(255), allowNull: true },
      customerPhone: { type: DataTypes.STRING(20), allowNull: true },
      region: { type: DataTypes.STRING(100), allowNull: true },
      store: { type: DataTypes.STRING(255), allowNull: true },
      priority: { type: DataTypes.ENUM("low", "medium", "high"), allowNull: false, defaultValue: "medium" },
      assignedToName: { type: DataTypes.STRING(255), allowNull: true },
      lastUpdatedLabel: { type: DataTypes.STRING(255), allowNull: true },
      overdue: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      blockedReason: { type: DataTypes.STRING(255), allowNull: true },
      highValue: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      preferredDeliveryWindow: { type: DataTypes.STRING(100), allowNull: true },
      deliveryZone: { type: DataTypes.STRING(100), allowNull: true },
      assignedCarrierName: { type: DataTypes.STRING(255), allowNull: true },
      trackingNumber: { type: DataTypes.STRING(100), allowNull: true },
      promoCode: { type: DataTypes.STRING(100), allowNull: true },
      cancellationReason: { type: DataTypes.STRING(255), allowNull: true },
      customerSatisfaction: { type: DataTypes.STRING(100), allowNull: true },
      timelineJson: { type: DataTypes.JSON, allowNull: true },
      relatedOrderIdsJson: { type: DataTypes.JSON, allowNull: true },
      notesJson: { type: DataTypes.JSON, allowNull: true },
      communicationLogJson: { type: DataTypes.JSON, allowNull: true },
      payloadJson: { type: DataTypes.JSON, allowNull: true },
      totalItems: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      tax: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      shippingCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: { type: DataTypes.ENUM("pending", "processing", "ready_to_dispatch", "dispatched", "delivered", "cancelled"), allowNull: false, defaultValue: "pending" },
      paymentStatus: { type: DataTypes.ENUM("pending", "completed", "failed", "refunded"), allowNull: false, defaultValue: "pending" },
      paymentMethod: { type: DataTypes.ENUM("cash", "card", "digital_wallet", "mixed"), allowNull: true },
      deliveryAddress: { type: DataTypes.TEXT, allowNull: false },
      deliveryCity: { type: DataTypes.STRING(100), allowNull: false },
      deliveryZipCode: { type: DataTypes.STRING(20), allowNull: true },
      deliveryPhone: { type: DataTypes.STRING(20), allowNull: true },
      preferredDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
      actualDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
      deliveryInstructions: { type: DataTypes.TEXT, allowNull: true },
      assignedWarehouseStaff: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      assignedDelivery: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [{ unique: true, fields: ["orderId"] }, { fields: ["customerId"] }, { fields: ["status"] }, { fields: ["paymentStatus"] }, { fields: ["createdAt"] }],
    },
  );

  return Order;
}

async function ensureCustomerUser(document: any) {
  if (document.customerId) {
    return Number(document.customerId);
  }

  const email = String(document.customerEmail ?? `${String(document.customerName ?? "customer").toLowerCase().replace(/\s+/g, ".")}@nestlesmartflow.local`).toLowerCase();
  const [user] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      password: "seeded-placeholder",
      fullName: document.customerName ?? "Retail Customer",
      role: "retailer",
      company: document.store ?? document.customerName ?? "Retail Customer",
      phone: document.customerPhone ?? null,
      city: document.region ?? document.deliveryCity ?? null,
      status: "active",
    },
  });

  return user.id;
}

function toPlain(instance: any) {
  const payload = instance.payloadJson ?? {};
  return {
    ...payload,
    _id: instance.id,
    id: instance.id,
    customerName: payload.customerName ?? instance.customerName,
    customerEmail: payload.customerEmail ?? instance.customerEmail,
    customerPhone: payload.customerPhone ?? instance.customerPhone,
    orderDate: payload.orderDate ?? instance.createdAt?.toISOString(),
    totalAmount: Number(payload.totalAmount ?? instance.totalAmount),
    status: payload.status ?? orderStatusFromDatabase(instance.status),
    region: payload.region ?? instance.region,
    store: payload.store ?? instance.store,
    priority: payload.priority ?? (instance.priority ? instance.priority.charAt(0).toUpperCase() + instance.priority.slice(1) : "Medium"),
    assignedTo: payload.assignedTo ?? instance.assignedToName,
    lastUpdated: payload.lastUpdated ?? instance.lastUpdatedLabel ?? instance.updatedAt?.toISOString(),
    overdue: payload.overdue ?? Boolean(instance.overdue),
    blockedReason: payload.blockedReason ?? instance.blockedReason,
    highValue: payload.highValue ?? Boolean(instance.highValue),
    deliveryAddress: payload.deliveryAddress ?? instance.deliveryAddress,
    preferredDeliveryWindow: payload.preferredDeliveryWindow ?? instance.preferredDeliveryWindow,
    deliveryInstructions: payload.deliveryInstructions ?? instance.deliveryInstructions,
    deliveryZone: payload.deliveryZone ?? instance.deliveryZone,
    assignedCarrier: payload.assignedCarrier ?? instance.assignedCarrierName,
    trackingNumber: payload.trackingNumber ?? instance.trackingNumber,
    paymentMethod: payload.paymentMethod ?? instance.paymentMethod,
    paymentStatus: payload.paymentStatus ?? instance.paymentStatus,
    transactionId: payload.transactionId ?? instance.orderId,
    items: payload.items ?? [],
    subtotal: Number(payload.subtotal ?? instance.subtotal),
    tax: Number(payload.tax ?? instance.tax),
    shippingCost: Number(payload.shippingCost ?? instance.shippingCost),
    discount: Number(payload.discount ?? instance.discountAmount),
    promoCode: payload.promoCode ?? instance.promoCode,
    timeline: payload.timeline ?? instance.timelineJson ?? [],
    relatedOrderIds: payload.relatedOrderIds ?? instance.relatedOrderIdsJson ?? [],
    notes: payload.notes ?? instance.notesJson ?? [],
    cancellationReason: payload.cancellationReason ?? instance.cancellationReason,
    customerSatisfaction: payload.customerSatisfaction ?? instance.customerSatisfaction,
    communicationLog: payload.communicationLog ?? instance.communicationLogJson ?? [],
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
  };
}

async function syncOrderItems(instance: any, document: any) {
  await OrderItem.destroy({ where: { orderId: instance.id } });
  const items = Array.isArray(document.items) ? document.items : [];

  for (const item of items) {
    let product = item.sku ? await Product.findOne({ where: { sku: item.sku } }) : null;
    if (!product) {
      product = await Product.create({
        sku: item.sku ?? `SKU-${Date.now()}`,
        name: item.name ?? item.productName ?? "Product",
        category: item.category ?? "General",
        price: item.unitPrice ?? 0,
        image: item.image ?? null,
      });
    }

    await OrderItem.create({
      orderId: instance.id,
      productId: product.id,
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      subtotal: item.subtotal ?? (item.quantity ?? 1) * (item.unitPrice ?? 0),
      specialInstructions: item.notes ?? null,
    });
  }
}

async function applyDocument(instance: any, document: any) {
  instance.orderId = document.orderId ?? instance.orderId ?? `ORD-${String(Date.now()).slice(-6)}`;
  instance.customerId = await ensureCustomerUser(document);
  instance.customerName = document.customerName ?? null;
  instance.customerEmail = document.customerEmail ?? null;
  instance.customerPhone = document.customerPhone ?? null;
  instance.region = document.region ?? null;
  instance.store = document.store ?? null;
  instance.priority = String(document.priority ?? "medium").toLowerCase();
  instance.assignedToName = document.assignedTo ?? null;
  instance.lastUpdatedLabel = document.lastUpdated ?? null;
  instance.overdue = Boolean(document.overdue);
  instance.blockedReason = document.blockedReason ?? null;
  instance.highValue = Boolean(document.highValue);
  instance.preferredDeliveryWindow = document.preferredDeliveryWindow ?? null;
  instance.deliveryZone = document.deliveryZone ?? null;
  instance.assignedCarrierName = document.assignedCarrier ?? null;
  instance.trackingNumber = document.trackingNumber ?? null;
  instance.promoCode = document.promoCode ?? null;
  instance.cancellationReason = document.cancellationReason ?? null;
  instance.customerSatisfaction = document.customerSatisfaction ?? null;
  instance.timelineJson = document.timeline ?? [];
  instance.relatedOrderIdsJson = document.relatedOrderIds ?? [];
  instance.notesJson = document.notes ?? [];
  instance.communicationLogJson = document.communicationLog ?? [];
  instance.payloadJson = { ...document };
  instance.totalItems = Array.isArray(document.items) ? document.items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0) : Number(document.totalItems ?? 0);
  instance.subtotal = document.subtotal ?? 0;
  instance.tax = document.tax ?? 0;
  instance.shippingCost = document.shippingCost ?? 0;
  instance.discountAmount = document.discount ?? document.discountAmount ?? 0;
  instance.totalAmount = document.totalAmount ?? 0;
  instance.status = orderStatusToDatabase(document.status);
  instance.paymentStatus = ["pending", "completed", "failed", "refunded"].includes(String(document.paymentStatus).toLowerCase()) ? String(document.paymentStatus).toLowerCase() : "pending";
  instance.paymentMethod = ["cash", "card", "digital_wallet", "mixed"].includes(String(document.paymentMethod).toLowerCase().replace(/\s+/g, "_")) ? String(document.paymentMethod).toLowerCase().replace(/\s+/g, "_") : null;
  instance.deliveryAddress = document.deliveryAddress ?? "Unknown address";
  instance.deliveryCity = document.deliveryCity ?? document.region ?? "Unknown city";
  instance.deliveryZipCode = document.deliveryZipCode ?? null;
  instance.deliveryPhone = document.deliveryPhone ?? document.customerPhone ?? null;
  instance.preferredDeliveryDate = document.preferredDeliveryDate ?? null;
  instance.actualDeliveryDate = document.actualDeliveryDate ?? null;
  instance.deliveryInstructions = document.deliveryInstructions ?? null;
  instance.assignedWarehouseStaff = document.assignedWarehouseStaff ?? null;
  instance.assignedDelivery = document.assignedDelivery ?? null;
  await instance.save();
  await syncOrderItems(instance, document);
}

function toDocument(instance: any) {
  const document = attachDocument(toPlain(instance), instance.id, async () => {
    await applyDocument(instance, document);
  });

  return document;
}

async function fetchOne(where: Record<string, unknown>, lean: boolean) {
  const normalizedWhere: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(where)) {
    normalizedWhere[key === "_id" ? "id" : key] = key === "status" ? orderStatusToDatabase(String(value)) : value;
  }

  const row = await Order.findOne({ where: normalizedWhere });
  if (!row) {
    return null;
  }

  return lean ? toPlain(row) : toDocument(row);
}

export const OrderModel = {
  countDocuments() {
    return Order.count();
  },

  async insertMany(items: Record<string, unknown>[]) {
    const created = [];
    for (const item of items) {
      created.push(await OrderModel.create(item));
    }
    return created;
  },

  async create(item: Record<string, unknown>) {
    const instance = await Order.create({
      orderId: item.orderId ?? `ORD-${String(Date.now()).slice(-6)}`,
      customerId: await ensureCustomerUser(item),
      customerName: item.customerName ?? null,
      customerEmail: item.customerEmail ?? null,
      customerPhone: item.customerPhone ?? null,
      region: item.region ?? null,
      store: item.store ?? null,
      priority: String(item.priority ?? "medium").toLowerCase(),
      assignedToName: item.assignedTo ?? null,
      lastUpdatedLabel: item.lastUpdated ?? null,
      overdue: Boolean(item.overdue),
      blockedReason: item.blockedReason ?? null,
      highValue: Boolean(item.highValue),
      preferredDeliveryWindow: item.preferredDeliveryWindow ?? null,
      deliveryZone: item.deliveryZone ?? null,
      assignedCarrierName: item.assignedCarrier ?? null,
      trackingNumber: item.trackingNumber ?? null,
      promoCode: item.promoCode ?? null,
      cancellationReason: item.cancellationReason ?? null,
      customerSatisfaction: item.customerSatisfaction ?? null,
      timelineJson: item.timeline ?? [],
      relatedOrderIdsJson: item.relatedOrderIds ?? [],
      notesJson: item.notes ?? [],
      communicationLogJson: item.communicationLog ?? [],
      payloadJson: { ...item },
      totalItems: Array.isArray(item.items) ? (item.items as any[]).reduce((sum, entry) => sum + Number(entry.quantity ?? 0), 0) : Number(item.totalItems ?? 0),
      subtotal: item.subtotal ?? 0,
      tax: item.tax ?? 0,
      shippingCost: item.shippingCost ?? 0,
      discountAmount: item.discount ?? item.discountAmount ?? 0,
      totalAmount: item.totalAmount ?? 0,
      status: orderStatusToDatabase(String(item.status ?? "Pending")),
      paymentStatus: ["pending", "completed", "failed", "refunded"].includes(String(item.paymentStatus).toLowerCase()) ? String(item.paymentStatus).toLowerCase() : "pending",
      paymentMethod: ["cash", "card", "digital_wallet", "mixed"].includes(String(item.paymentMethod).toLowerCase().replace(/\s+/g, "_")) ? String(item.paymentMethod).toLowerCase().replace(/\s+/g, "_") : null,
      deliveryAddress: item.deliveryAddress ?? "Unknown address",
      deliveryCity: item.deliveryCity ?? item.region ?? "Unknown city",
      deliveryZipCode: item.deliveryZipCode ?? null,
      deliveryPhone: item.deliveryPhone ?? item.customerPhone ?? null,
      preferredDeliveryDate: item.preferredDeliveryDate ?? null,
      actualDeliveryDate: item.actualDeliveryDate ?? null,
      deliveryInstructions: item.deliveryInstructions ?? null,
      assignedWarehouseStaff: item.assignedWarehouseStaff ?? null,
      assignedDelivery: item.assignedDelivery ?? null,
    });

    await syncOrderItems(instance, item);
    return toDocument(instance);
  },

  find(where: Record<string, unknown> = {}) {
    return new ManyRecordQuery(async ({ sort, limit }, lean) => {
      const normalizedWhere: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(where)) {
        normalizedWhere[key === "_id" ? "id" : key] = key === "status" ? orderStatusToDatabase(String(value)) : value;
      }

      const rows = await Order.findAll({
        where: normalizedWhere,
        order: sort ? Object.entries(sort).map(([key, direction]) => [key, direction === -1 ? "DESC" : "ASC"]) : undefined,
        limit,
      });

      return rows.map((row) => (lean ? toPlain(row) : toDocument(row)));
    });
  },

  findById(id: string | number) {
    return new SingleRecordQuery((lean) => fetchOne({ _id: id }, lean));
  },

  findByIdAndUpdate(id: string | number, payload: Record<string, unknown>) {
    return Order.findByPk(id).then(async (instance) => {
      if (!instance) {
        return null;
      }

      const document = toDocument(instance);
      Object.assign(document, payload);
      await document.save();
      return document;
    });
  },

  findOne(where: Record<string, unknown>) {
    return new SingleRecordQuery((lean) => fetchOne(where, lean));
  },
};