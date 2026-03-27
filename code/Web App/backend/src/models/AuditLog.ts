import { DataTypes, Model, Sequelize } from "sequelize";

export class AuditLog extends Model {
  declare id: number;
}

export function initAuditLogModel(sequelize: Sequelize) {
  if (sequelize.models.AuditLog) {
    return sequelize.models.AuditLog as typeof AuditLog;
  }

  AuditLog.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entityType: { type: DataTypes.STRING(100), allowNull: false },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    oldValue: { type: DataTypes.JSON, allowNull: true },
    newValue: { type: DataTypes.JSON, allowNull: true },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    sequelize,
    modelName: "AuditLog",
    tableName: "audit_logs",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["userId"] }, { fields: ["action"] }, { fields: ["entityType"] }, { fields: ["createdAt"] }],
  });

  return AuditLog;
}