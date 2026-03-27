import { DataTypes, Model, Sequelize } from "sequelize";

import { attachDocument, ManyRecordQuery, SingleRecordQuery, taskPriorityFromDatabase, taskPriorityToDatabase, taskStatusFromDatabase, taskStatusToDatabase, taskTypeFromDatabase, taskTypeToDatabase } from "./compat";

export class WarehouseTask extends Model {
  declare id: number;
}

export function initWarehouseTaskModel(sequelize: Sequelize) {
  if (sequelize.models.WarehouseTask) {
    return sequelize.models.WarehouseTask as typeof WarehouseTask;
  }

  WarehouseTask.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      taskId: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      taskType: { type: DataTypes.ENUM("pick", "pack", "receive", "verify", "dispatch"), allowNull: false },
      orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      assignedTo: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      assignedToName: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      zone: { type: DataTypes.STRING(100), allowNull: true },
      instructionsJson: { type: DataTypes.JSON, allowNull: true },
      priority: { type: DataTypes.ENUM("low", "medium", "high"), allowNull: false, defaultValue: "medium" },
      status: { type: DataTypes.ENUM("pending", "in_progress", "on_hold", "completed", "cancelled"), allowNull: false, defaultValue: "pending" },
      progressPercentage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      dueDate: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      payloadJson: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: "WarehouseTask",
      tableName: "warehouse_tasks",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [{ unique: true, fields: ["taskId"] }, { fields: ["taskType"] }, { fields: ["assignedTo"] }, { fields: ["status"] }, { fields: ["dueDate"] }],
    },
  );

  return WarehouseTask;
}

function toPlain(instance: any) {
  const payload = instance.payloadJson ?? {};
  return {
    ...payload,
    _id: instance.id,
    id: instance.id,
    type: payload.type ?? taskTypeFromDatabase(instance.taskType),
    title: payload.title ?? instance.title,
    description: payload.description ?? instance.description,
    priority: payload.priority ?? taskPriorityFromDatabase(instance.priority),
    assignee: payload.assignee ?? instance.assignedToName,
    createdDate: payload.createdDate ?? instance.createdAt?.toISOString(),
    dueTime: payload.dueTime ?? instance.dueDate?.toISOString(),
    status: payload.status ?? taskStatusFromDatabase(instance.status),
    progress: payload.progress ?? instance.progressPercentage,
    zone: payload.zone ?? instance.zone,
    orderId: payload.orderId ?? instance.orderId,
    customerName: payload.customerName,
    instructions: payload.instructions ?? instance.instructionsJson ?? [],
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
  };
}

async function applyDocument(instance: any, document: any) {
  instance.taskId = document.taskId ?? instance.taskId ?? `TASK-${String(Date.now()).slice(-6)}`;
  instance.title = document.title ?? null;
  instance.taskType = taskTypeToDatabase(document.type);
  instance.orderId = typeof document.orderId === "number" ? document.orderId : null;
  instance.assignedToName = document.assignee ?? null;
  instance.description = document.description ?? null;
  instance.zone = document.zone ?? null;
  instance.instructionsJson = document.instructions ?? [];
  instance.priority = taskPriorityToDatabase(document.priority);
  instance.status = taskStatusToDatabase(document.status);
  instance.progressPercentage = document.progress ?? 0;
  instance.dueDate = document.dueTime ?? null;
  instance.completedAt = document.status === "Completed" ? new Date() : null;
  instance.notes = Array.isArray(document.instructions) ? document.instructions.join(" | ") : document.notes ?? null;
  instance.payloadJson = { ...document };
  await instance.save();
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
    normalizedWhere[key === "_id" ? "id" : key] = key === "status" ? taskStatusToDatabase(String(value)) : value;
  }

  const row = await WarehouseTask.findOne({ where: normalizedWhere });
  if (!row) {
    return null;
  }

  return lean ? toPlain(row) : toDocument(row);
}

export const WarehouseTaskModel: any = {
  countDocuments() {
    return WarehouseTask.count();
  },

  async insertMany(items: Record<string, unknown>[]) {
    const created = [];
    for (const item of items) {
      created.push(await WarehouseTaskModel.create(item));
    }
    return created;
  },

  async create(item: Record<string, unknown>) {
    const instance = await WarehouseTask.create({
      taskId: item.taskId ?? `TASK-${String(Date.now()).slice(-6)}`,
      title: item.title ?? null,
      taskType: taskTypeToDatabase(String(item.type ?? item.taskType ?? "Pick")),
      orderId: typeof item.orderId === "number" ? item.orderId : null,
      assignedToName: item.assignee ?? null,
      description: item.description ?? null,
      zone: item.zone ?? null,
      instructionsJson: item.instructions ?? [],
      priority: taskPriorityToDatabase(String(item.priority ?? "Medium")),
      status: taskStatusToDatabase(String(item.status ?? "Pending")),
      progressPercentage: item.progress ?? 0,
      dueDate: item.dueTime ?? null,
      completedAt: null,
      notes: item.notes ?? null,
      payloadJson: { ...item },
    });

    return toDocument(instance);
  },

  find(where: Record<string, unknown> = {}) {
    return new ManyRecordQuery(async ({ sort, limit }, lean) => {
      const normalizedWhere: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(where)) {
        normalizedWhere[key === "_id" ? "id" : key] = key === "status" ? taskStatusToDatabase(String(value)) : value;
      }

      const rows = await WarehouseTask.findAll({
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

  findByIdAndUpdate(id: string | number, payload: Record<string, unknown>, _options?: Record<string, unknown>) {
    return WarehouseTask.findByPk(id).then(async (instance) => {
      if (!instance) {
        return null;
      }

      const document = toDocument(instance);
      Object.assign(document, payload);
      await document.save();
      return document;
    });
  },
};