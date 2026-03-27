import { DataTypes, Model, Sequelize } from "sequelize";

export class POSTransaction extends Model {
  declare id: number;
}

export function initPOSTransactionModel(sequelize: Sequelize) {
  if (sequelize.models.POSTransaction) {
    return sequelize.models.POSTransaction as typeof POSTransaction;
  }

  POSTransaction.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    transactionId: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    cashierId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    cashierName: { type: DataTypes.STRING(255), allowNull: true },
    storeLocation: { type: DataTypes.STRING(100), allowNull: false },
    topProduct: { type: DataTypes.STRING(255), allowNull: true },
    totalItems: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tax: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMethod: { type: DataTypes.ENUM("cash", "card", "digital_wallet", "mixed"), allowNull: false },
    changeAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM("completed", "pending", "cancelled", "refunded"), allowNull: false, defaultValue: "completed" },
    customerName: { type: DataTypes.STRING(255), allowNull: true },
    customerPhone: { type: DataTypes.STRING(20), allowNull: true },
    customerEmail: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    receiptPrinted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    transactionTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    payloadJson: { type: DataTypes.JSON, allowNull: true },
  }, {
    sequelize,
    modelName: "POSTransaction",
    tableName: "pos_transactions",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ unique: true, fields: ["transactionId"] }, { fields: ["cashierId"] }, { fields: ["transactionTime"] }, { fields: ["status"] }],
  });

  return POSTransaction;
}