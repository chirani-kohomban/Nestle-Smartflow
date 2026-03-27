import { DataTypes, Model, Sequelize } from "sequelize";

export class Inventory extends Model {
  declare id: number;
}

export function initInventoryModel(sequelize: Sequelize) {
  if (sequelize.models.Inventory) {
    return sequelize.models.Inventory as typeof Inventory;
  }

  Inventory.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseLocation: { type: DataTypes.STRING(100), allowNull: false },
    rackLocation: { type: DataTypes.STRING(100), allowNull: true },
    currentStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reorderLevel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    reorderQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
    lastStockUpdate: { type: DataTypes.DATE, allowNull: true },
    lastCountDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM("in_stock", "low_stock", "out_of_stock"), allowNull: false, defaultValue: "in_stock" },
    payloadJson: { type: DataTypes.JSON, allowNull: true },
  }, {
    sequelize,
    modelName: "Inventory",
    tableName: "inventory",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [
      { fields: ["productId"] },
      { fields: ["warehouseLocation"] },
      { fields: ["status"] },
    ],
  });

  return Inventory;
}