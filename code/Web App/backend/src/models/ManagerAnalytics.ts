import { DataTypes, Model, Sequelize } from "sequelize";

export class ManagerAnalytics extends Model {
  declare id: number;
}

export function initManagerAnalyticsModel(sequelize: Sequelize) {
  if (sequelize.models.ManagerAnalytics) {
    return sequelize.models.ManagerAnalytics as typeof ManagerAnalytics;
  }

  ManagerAnalytics.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    analyticsDate: { type: DataTypes.DATEONLY, allowNull: false },
    totalSales: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    staffProductivity: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    inventoryCoverage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    openOrders: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    urgentOrders: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lowStockItems: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    onTimeDeliveryRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  }, {
    sequelize,
    modelName: "ManagerAnalytics",
    tableName: "manager_analytics",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["analyticsDate"] }],
  });

  return ManagerAnalytics;
}