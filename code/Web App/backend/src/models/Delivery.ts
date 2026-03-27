import { DataTypes, Model, Sequelize } from "sequelize";

import { attachDocument, deliveryPriorityFromDatabase, deliveryPriorityToDatabase, deliveryStatusFromDatabase, deliveryStatusToDatabase, ManyRecordQuery, parseJsonValue, SingleRecordQuery } from "./compat";

export class Delivery extends Model {
  declare id: number;
}

export function initDeliveryModel(sequelize: Sequelize) {
  if (sequelize.models.Delivery) {
    return sequelize.models.Delivery as typeof Delivery;
  }

  Delivery.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      deliveryId: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      orderId: { type: DataTypes.STRING(50), allowNull: false },
      shipmentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      routeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      trackingNumber: { type: DataTypes.STRING(100), allowNull: false },
      customerName: { type: DataTypes.STRING(255), allowNull: false },
      customerPhone: { type: DataTypes.STRING(20), allowNull: false },
      customerEmail: { type: DataTypes.STRING(255), allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
      scheduledTime: { type: DataTypes.DATE, allowNull: false },
      actualTime: { type: DataTypes.DATE, allowNull: true },
      status: { type: DataTypes.ENUM("pending", "in_transit", "awaiting_handoff", "delivered", "failed", "returned"), allowNull: false, defaultValue: "pending" },
      priority: { type: DataTypes.ENUM("low", "medium", "high"), allowNull: false, defaultValue: "medium" },
      itemsCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      weight: { type: DataTypes.STRING(100), allowNull: false },
      specialInstructions: { type: DataTypes.TEXT, allowNull: true },
      proofStatus: { type: DataTypes.ENUM("Proof attached", "Proof pending"), allowNull: false, defaultValue: "Proof pending" },
      overdue: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      itemsJson: { type: DataTypes.JSON, allowNull: true },
      deliveryWindow: { type: DataTypes.STRING(100), allowNull: false },
      parkingInstructions: { type: DataTypes.TEXT, allowNull: true },
      contactPerson: { type: DataTypes.STRING(255), allowNull: true },
      recipientRequirements: { type: DataTypes.TEXT, allowNull: true },
      leaveInstructions: { type: DataTypes.TEXT, allowNull: true },
      distanceFromCurrentKm: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      estimatedMinutesToReach: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      trafficConditions: { type: DataTypes.STRING(100), allowNull: false },
      proofJson: { type: DataTypes.JSON, allowNull: true },
      issueJson: { type: DataTypes.JSON, allowNull: true },
      historyJson: { type: DataTypes.JSON, allowNull: true },
      payloadJson: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: "Delivery",
      tableName: "deliveries",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [{ unique: true, fields: ["deliveryId"] }, { fields: ["trackingNumber"] }, { fields: ["routeId"] }, { fields: ["status"] }, { fields: ["scheduledTime"] }],
    },
  );

  return Delivery;
}

function withIds<T extends Record<string, unknown>>(items: T[] | undefined, prefix: string) {
  return (items ?? []).map((item, index) => ({ _id: `${prefix}-${index + 1}`, ...item }));
}

function toPlain(instance: any) {
  const payload = instance.payloadJson ?? {};
  const proof = parseJsonValue<Record<string, unknown> | undefined>(payload.proof ?? instance.proofJson, undefined);
  return {
    ...payload,
    _id: instance.id,
    id: instance.id,
    orderId: payload.orderId ?? instance.orderId,
    trackingNumber: payload.trackingNumber ?? instance.trackingNumber,
    customerName: payload.customerName ?? instance.customerName,
    customerPhone: payload.customerPhone ?? instance.customerPhone,
    customerEmail: payload.customerEmail ?? instance.customerEmail,
    address: payload.address ?? instance.address,
    coordinates: payload.coordinates ?? { latitude: Number(instance.latitude ?? 0), longitude: Number(instance.longitude ?? 0) },
    scheduledTime: payload.scheduledTime ?? instance.scheduledTime?.toISOString(),
    actualTime: payload.actualTime ?? instance.actualTime?.toISOString(),
    status: payload.status ?? deliveryStatusFromDatabase(instance.status),
    priority: payload.priority ?? deliveryPriorityFromDatabase(instance.priority),
    itemsCount: payload.itemsCount ?? instance.itemsCount,
    weight: payload.weight ?? instance.weight,
    specialInstructions: payload.specialInstructions ?? instance.specialInstructions,
    proofStatus: payload.proofStatus ?? instance.proofStatus,
    overdue: payload.overdue ?? Boolean(instance.overdue),
    routeId: payload.routeId ?? instance.routeId,
    items: withIds(parseJsonValue(payload.items ?? instance.itemsJson, []), `delivery-${instance.id}-item`),
    deliveryWindow: payload.deliveryWindow ?? instance.deliveryWindow,
    parkingInstructions: payload.parkingInstructions ?? instance.parkingInstructions,
    contactPerson: payload.contactPerson ?? instance.contactPerson,
    recipientRequirements: payload.recipientRequirements ?? instance.recipientRequirements,
    leaveInstructions: payload.leaveInstructions ?? instance.leaveInstructions,
    distanceFromCurrentKm: Number(payload.distanceFromCurrentKm ?? instance.distanceFromCurrentKm),
    estimatedMinutesToReach: payload.estimatedMinutesToReach ?? instance.estimatedMinutesToReach,
    trafficConditions: payload.trafficConditions ?? instance.trafficConditions,
    proof: proof ? { _id: `delivery-${instance.id}-proof`, ...proof } : undefined,
    issue: parseJsonValue(payload.issue ?? instance.issueJson, undefined),
    history: parseJsonValue(payload.history ?? instance.historyJson, []),
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
  };
}

function stripId<T extends Record<string, unknown>>(value: T | undefined) {
  if (!value) {
    return value;
  }
  const { _id: _ignored, ...rest } = value;
  return rest;
}

function toDocument(instance: any) {
  const document = attachDocument(toPlain(instance), instance.id, async () => {
    instance.deliveryId = document.deliveryId ?? instance.deliveryId ?? `DEL-${String(Date.now()).slice(-6)}`;
    instance.orderId = document.orderId;
    instance.routeId = document.routeId;
    instance.trackingNumber = document.trackingNumber;
    instance.customerName = document.customerName;
    instance.customerPhone = document.customerPhone;
    instance.customerEmail = document.customerEmail;
    instance.address = document.address;
    instance.latitude = document.coordinates?.latitude ?? null;
    instance.longitude = document.coordinates?.longitude ?? null;
    instance.scheduledTime = document.scheduledTime;
    instance.actualTime = document.actualTime ?? null;
    instance.status = deliveryStatusToDatabase(document.status);
    instance.priority = deliveryPriorityToDatabase(document.priority);
    instance.itemsCount = document.itemsCount;
    instance.weight = document.weight;
    instance.specialInstructions = document.specialInstructions ?? null;
    instance.proofStatus = document.proofStatus ?? "Proof pending";
    instance.overdue = Boolean(document.overdue);
    instance.itemsJson = (document.items ?? []).map((entry: any) => stripId(entry));
    instance.deliveryWindow = document.deliveryWindow;
    instance.parkingInstructions = document.parkingInstructions ?? null;
    instance.contactPerson = document.contactPerson ?? null;
    instance.recipientRequirements = document.recipientRequirements ?? null;
    instance.leaveInstructions = document.leaveInstructions ?? null;
    instance.distanceFromCurrentKm = document.distanceFromCurrentKm ?? 0;
    instance.estimatedMinutesToReach = document.estimatedMinutesToReach ?? 0;
    instance.trafficConditions = document.trafficConditions;
    instance.proofJson = stripId(document.proof);
    instance.issueJson = document.issue ?? null;
    instance.historyJson = document.history ?? [];
    instance.payloadJson = { ...document };
    await instance.save();
  });

  return document;
}

export const DeliveryModel = {
  countDocuments() {
    return Delivery.count();
  },

  async insertMany(items: Record<string, unknown>[]) {
    const created = [];
    for (const item of items) {
      created.push(await DeliveryModel.create(item));
    }
    return created;
  },

  async create(item: Record<string, unknown>) {
    const instance = await Delivery.create({
      deliveryId: item.deliveryId ?? `DEL-${String(Date.now()).slice(-6)}`,
      orderId: item.orderId,
      routeId: item.routeId,
      trackingNumber: item.trackingNumber,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      customerEmail: item.customerEmail,
      address: item.address,
      latitude: (item.coordinates as Record<string, unknown> | undefined)?.latitude ?? null,
      longitude: (item.coordinates as Record<string, unknown> | undefined)?.longitude ?? null,
      scheduledTime: item.scheduledTime,
      actualTime: item.actualTime ?? null,
      status: deliveryStatusToDatabase(String(item.status ?? "Pending")),
      priority: deliveryPriorityToDatabase(String(item.priority ?? "Standard")),
      itemsCount: item.itemsCount,
      weight: item.weight,
      specialInstructions: item.specialInstructions ?? null,
      proofStatus: item.proofStatus ?? "Proof pending",
      overdue: Boolean(item.overdue),
      itemsJson: item.items ?? [],
      deliveryWindow: item.deliveryWindow,
      parkingInstructions: item.parkingInstructions ?? null,
      contactPerson: item.contactPerson ?? null,
      recipientRequirements: item.recipientRequirements ?? null,
      leaveInstructions: item.leaveInstructions ?? null,
      distanceFromCurrentKm: item.distanceFromCurrentKm ?? 0,
      estimatedMinutesToReach: item.estimatedMinutesToReach ?? 0,
      trafficConditions: item.trafficConditions ?? "Normal",
      proofJson: item.proof ?? null,
      issueJson: item.issue ?? null,
      historyJson: item.history ?? [],
      payloadJson: { ...item },
    });

    return toDocument(instance);
  },

  find(where: Record<string, unknown> = {}) {
    return new ManyRecordQuery(async ({ sort, limit }, lean) => {
      const rows = await Delivery.findAll({
        where: Object.fromEntries(Object.entries(where).map(([key, value]) => [key === "_id" ? "id" : key, key === "status" ? deliveryStatusToDatabase(String(value)) : key === "priority" ? deliveryPriorityToDatabase(String(value)) : value])),
        order: sort ? Object.entries(sort).map(([key, direction]) => [key, direction === -1 ? "DESC" : "ASC"]) : undefined,
        limit,
      });

      return rows.map((row) => (lean ? toPlain(row) : toDocument(row)));
    });
  },

  findById(id: string | number) {
    return new SingleRecordQuery(async (lean) => {
      const row = await Delivery.findByPk(id);
      return row ? (lean ? toPlain(row) : toDocument(row)) : null;
    });
  },

  findOne(where: Record<string, unknown>) {
    return new SingleRecordQuery(async (lean) => {
      const row = await Delivery.findOne({ where: Object.fromEntries(Object.entries(where).map(([key, value]) => [key === "_id" ? "id" : key, key === "status" ? deliveryStatusToDatabase(String(value)) : key === "priority" ? deliveryPriorityToDatabase(String(value)) : value])) });
      return row ? (lean ? toPlain(row) : toDocument(row)) : null;
    });
  },
};