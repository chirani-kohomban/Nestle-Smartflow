import { DataTypes, Model, Sequelize } from "sequelize";

export class Notification extends Model {
  declare id: number;
}

export function initNotificationModel(sequelize: Sequelize) {
  if (sequelize.models.Notification) {
    return sequelize.models.Notification as typeof Notification;
  }

  Notification.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM("order", "delivery", "stock", "task", "system"), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    relatedEntityType: { type: DataTypes.STRING(100), allowNull: true },
    relatedEntityId: { type: DataTypes.INTEGER, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["userId"] }, { fields: ["isRead"] }, { fields: ["createdAt"] }],
  });

  return Notification;
}