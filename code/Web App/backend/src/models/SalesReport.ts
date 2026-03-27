import { DataTypes, Model, Sequelize } from "sequelize";

export class SalesReport extends Model {
  declare id: number;
}

export function initSalesReportModel(sequelize: Sequelize) {
  if (sequelize.models.SalesReport) {
    return sequelize.models.SalesReport as typeof SalesReport;
  }

  SalesReport.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    reportDate: { type: DataTypes.DATEONLY, allowNull: false },
    reportType: { type: DataTypes.ENUM("daily", "weekly", "monthly"), allowNull: false },
    region: { type: DataTypes.STRING(100), allowNull: true },
    totalOrders: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    totalSales: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    totalTransactions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    averageOrderValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    averageBasketValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    onTimeDeliveryRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    failedDeliveries: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    returnRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  }, {
    sequelize,
    modelName: "SalesReport",
    tableName: "sales_reports",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["reportDate"] }, { fields: ["reportType"] }, { fields: ["region"] }],
  });

  return SalesReport;
}