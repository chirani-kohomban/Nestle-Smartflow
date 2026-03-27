import { DataTypes, Model, Sequelize } from "sequelize";

export class POSTransactionItem extends Model {
  declare id: number;
}

export function initPOSTransactionItemModel(sequelize: Sequelize) {
  if (sequelize.models.POSTransactionItem) {
    return sequelize.models.POSTransactionItem as typeof POSTransactionItem;
  }

  POSTransactionItem.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    transactionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  }, {
    sequelize,
    modelName: "POSTransactionItem",
    tableName: "pos_transaction_items",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["transactionId"] }, { fields: ["productId"] }],
  });

  return POSTransactionItem;
}