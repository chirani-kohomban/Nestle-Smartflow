import { DataTypes, Model, Sequelize } from "sequelize";

import { attachDocument, ManyRecordQuery, parseJsonValue, routePriorityFromDatabase, routePriorityToDatabase, routeStatusFromDatabase, routeStatusToDatabase, SingleRecordQuery } from "./compat";

export class DeliveryRoute extends Model {
  declare id: number;
}

export function initDeliveryRouteModel(sequelize: Sequelize) {
  if (sequelize.models.DeliveryRoute) {
    return sequelize.models.DeliveryRoute as typeof DeliveryRoute;
  }

  DeliveryRoute.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      routeId: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      startLocation: { type: DataTypes.STRING(255), allowNull: false },
      endLocation: { type: DataTypes.STRING(255), allowNull: false },
      startAddress: { type: DataTypes.TEXT, allowNull: false },
      endAddress: { type: DataTypes.TEXT, allowNull: false },
      plannedDistanceKm: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      actualDistanceKm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      deliveriesCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: { type: DataTypes.ENUM("pending", "in_progress", "completed", "cancelled"), allowNull: false, defaultValue: "pending" },
      priority: { type: DataTypes.ENUM("low", "medium", "high"), allowNull: false, defaultValue: "medium" },
      plannedDurationMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      actualDurationMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      scheduledStartTime: { type: DataTypes.DATE, allowNull: false },
      startTime: { type: DataTypes.DATE, allowNull: true },
      expectedCompletionTime: { type: DataTypes.DATE, allowNull: false },
      completionTime: { type: DataTypes.DATE, allowNull: true },
      performanceLabel: { type: DataTypes.ENUM("Ahead of schedule", "On schedule", "Behind schedule"), allowNull: false, defaultValue: "On schedule" },
      waypointsJson: { type: DataTypes.JSON, allowNull: true },
      stopsJson: { type: DataTypes.JSON, allowNull: true },
      optimizationSuggestionsJson: { type: DataTypes.JSON, allowNull: true },
      estimatedSavingsMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      currentLocationJson: { type: DataTypes.JSON, allowNull: true },
      vehicleInfo: { type: DataTypes.STRING(255), allowNull: false },
      fuelStatus: { type: DataTypes.STRING(100), allowNull: false },
      weather: { type: DataTypes.STRING(100), allowNull: false },
      roadConditions: { type: DataTypes.STRING(100), allowNull: false },
      payloadJson: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: "DeliveryRoute",
      tableName: "delivery_routes",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [{ unique: true, fields: ["routeId"] }, { fields: ["status"] }, { fields: ["priority"] }, { fields: ["scheduledStartTime"] }],
    },
  );

  return DeliveryRoute;
}

function withIds<T extends Record<string, unknown>>(items: T[] | undefined, prefix: string) {
  return (items ?? []).map((item, index) => ({ _id: `${prefix}-${index + 1}`, ...item }));
}

function toPlain(instance: any) {
  const payload = instance.payloadJson ?? {};
  const waypoints = withIds(parseJsonValue(payload.waypoints ?? instance.waypointsJson, []), `route-${instance.id}-waypoint`);
  const stops = withIds(parseJsonValue(payload.stops ?? instance.stopsJson, []), `route-${instance.id}-stop`);
  const currentLocation = parseJsonValue<Record<string, unknown> | undefined>(payload.currentLocation ?? instance.currentLocationJson, undefined);

  return {
    ...payload,
    _id: instance.id,
    id: instance.id,
    startLocation: payload.startLocation ?? instance.startLocation,
    endLocation: payload.endLocation ?? instance.endLocation,
    startAddress: payload.startAddress ?? instance.startAddress,
    endAddress: payload.endAddress ?? instance.endAddress,
    plannedDistanceKm: Number(payload.plannedDistanceKm ?? instance.plannedDistanceKm),
    actualDistanceKm: payload.actualDistanceKm == null ? instance.actualDistanceKm == null ? undefined : Number(instance.actualDistanceKm) : Number(payload.actualDistanceKm),
    deliveriesCount: payload.deliveriesCount ?? instance.deliveriesCount,
    status: payload.status ?? routeStatusFromDatabase(instance.status),
    priority: payload.priority ?? routePriorityFromDatabase(instance.priority),
    plannedDurationMinutes: payload.plannedDurationMinutes ?? instance.plannedDurationMinutes,
    actualDurationMinutes: payload.actualDurationMinutes ?? instance.actualDurationMinutes,
    scheduledStartTime: payload.scheduledStartTime ?? instance.scheduledStartTime?.toISOString(),
    startTime: payload.startTime ?? instance.startTime?.toISOString(),
    expectedCompletionTime: payload.expectedCompletionTime ?? instance.expectedCompletionTime?.toISOString(),
    completionTime: payload.completionTime ?? instance.completionTime?.toISOString(),
    performanceLabel: payload.performanceLabel ?? instance.performanceLabel,
    waypoints,
    stops,
    optimizationSuggestions: parseJsonValue(payload.optimizationSuggestions ?? instance.optimizationSuggestionsJson, []),
    estimatedSavingsMinutes: payload.estimatedSavingsMinutes ?? instance.estimatedSavingsMinutes,
    currentLocation: currentLocation ? { _id: `route-${instance.id}-current`, ...currentLocation } : undefined,
    vehicleInfo: payload.vehicleInfo ?? instance.vehicleInfo,
    fuelStatus: payload.fuelStatus ?? instance.fuelStatus,
    weather: payload.weather ?? instance.weather,
    roadConditions: payload.roadConditions ?? instance.roadConditions,
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
    instance.routeId = document.routeId ?? instance.routeId ?? `ROUTE-${String(Date.now()).slice(-6)}`;
    instance.startLocation = document.startLocation;
    instance.endLocation = document.endLocation;
    instance.startAddress = document.startAddress;
    instance.endAddress = document.endAddress;
    instance.plannedDistanceKm = document.plannedDistanceKm;
    instance.actualDistanceKm = document.actualDistanceKm ?? null;
    instance.deliveriesCount = document.deliveriesCount;
    instance.status = routeStatusToDatabase(document.status);
    instance.priority = routePriorityToDatabase(document.priority);
    instance.plannedDurationMinutes = document.plannedDurationMinutes;
    instance.actualDurationMinutes = document.actualDurationMinutes ?? null;
    instance.scheduledStartTime = document.scheduledStartTime;
    instance.startTime = document.startTime ?? null;
    instance.expectedCompletionTime = document.expectedCompletionTime;
    instance.completionTime = document.completionTime ?? null;
    instance.performanceLabel = document.performanceLabel ?? "On schedule";
    instance.waypointsJson = (document.waypoints ?? []).map((entry: any) => stripId(entry));
    instance.stopsJson = (document.stops ?? []).map((entry: any) => stripId(entry));
    instance.optimizationSuggestionsJson = document.optimizationSuggestions ?? [];
    instance.estimatedSavingsMinutes = document.estimatedSavingsMinutes ?? 0;
    instance.currentLocationJson = stripId(document.currentLocation);
    instance.vehicleInfo = document.vehicleInfo;
    instance.fuelStatus = document.fuelStatus;
    instance.weather = document.weather;
    instance.roadConditions = document.roadConditions;
    instance.payloadJson = { ...document };
    await instance.save();
  });

  return document;
}

export const DeliveryRouteModel = {
  countDocuments() {
    return DeliveryRoute.count();
  },

  async insertMany(items: Record<string, unknown>[]) {
    const created = [];
    for (const item of items) {
      created.push(await DeliveryRouteModel.create(item));
    }
    return created;
  },

  async create(item: Record<string, unknown>) {
    const instance = await DeliveryRoute.create({
      routeId: item.routeId ?? `ROUTE-${String(Date.now()).slice(-6)}`,
      startLocation: item.startLocation,
      endLocation: item.endLocation,
      startAddress: item.startAddress,
      endAddress: item.endAddress,
      plannedDistanceKm: item.plannedDistanceKm,
      actualDistanceKm: item.actualDistanceKm ?? null,
      deliveriesCount: item.deliveriesCount,
      status: routeStatusToDatabase(String(item.status ?? "Pending")),
      priority: routePriorityToDatabase(String(item.priority ?? "Standard")),
      plannedDurationMinutes: item.plannedDurationMinutes,
      actualDurationMinutes: item.actualDurationMinutes ?? null,
      scheduledStartTime: item.scheduledStartTime,
      startTime: item.startTime ?? null,
      expectedCompletionTime: item.expectedCompletionTime,
      completionTime: item.completionTime ?? null,
      performanceLabel: item.performanceLabel ?? "On schedule",
      waypointsJson: item.waypoints ?? [],
      stopsJson: item.stops ?? [],
      optimizationSuggestionsJson: item.optimizationSuggestions ?? [],
      estimatedSavingsMinutes: item.estimatedSavingsMinutes ?? 0,
      currentLocationJson: item.currentLocation ?? null,
      vehicleInfo: item.vehicleInfo,
      fuelStatus: item.fuelStatus,
      weather: item.weather,
      roadConditions: item.roadConditions,
      payloadJson: { ...item },
    });

    return toDocument(instance);
  },

  find(where: Record<string, unknown> = {}) {
    return new ManyRecordQuery(async ({ sort, limit }, lean) => {
      const rows = await DeliveryRoute.findAll({
        where: Object.fromEntries(Object.entries(where).map(([key, value]) => [key === "_id" ? "id" : key, key === "status" ? routeStatusToDatabase(String(value)) : key === "priority" ? routePriorityToDatabase(String(value)) : value])),
        order: sort ? Object.entries(sort).map(([key, direction]) => [key, direction === -1 ? "DESC" : "ASC"]) : undefined,
        limit,
      });

      return rows.map((row) => (lean ? toPlain(row) : toDocument(row)));
    });
  },

  findOne(where: Record<string, unknown>) {
    return new SingleRecordQuery(async (lean) => {
      const row = await DeliveryRoute.findOne({ where: Object.fromEntries(Object.entries(where).map(([key, value]) => [key === "_id" ? "id" : key, key === "status" ? routeStatusToDatabase(String(value)) : key === "priority" ? routePriorityToDatabase(String(value)) : value])) });
      return row ? (lean ? toPlain(row) : toDocument(row)) : null;
    });
  },

  findById(id: string | number) {
    return new SingleRecordQuery(async (lean) => {
      const row = await DeliveryRoute.findByPk(id);
      return row ? (lean ? toPlain(row) : toDocument(row)) : null;
    });
  },
};