USE `nestle_smartflow`;

DROP PROCEDURE IF EXISTS sp_sales_summary;
DELIMITER $$
CREATE PROCEDURE sp_sales_summary(IN p_start_date DATE, IN p_end_date DATE)
BEGIN
  SELECT
    DATE(transactionTime) AS salesDate,
    COUNT(*) AS transactionsCount,
    SUM(totalAmount) AS grossSales,
    SUM(totalItems) AS unitsSold
  FROM pos_transactions
  WHERE DATE(transactionTime) BETWEEN p_start_date AND p_end_date
    AND status = 'completed'
  GROUP BY DATE(transactionTime)
  ORDER BY salesDate ASC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_inventory_reorder_report;
DELIMITER $$
CREATE PROCEDURE sp_inventory_reorder_report(IN p_threshold_multiplier DECIMAL(5, 2))
BEGIN
  SELECT
    p.sku,
    p.name,
    p.category,
    i.currentStock,
    i.reorderLevel,
    i.reorderQuantity,
    i.warehouseLocation,
    i.status
  FROM inventory i
  INNER JOIN products p ON p.id = i.productId
  WHERE i.currentStock <= (i.reorderLevel * p_threshold_multiplier)
  ORDER BY i.currentStock ASC, i.reorderLevel DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delivery_earnings_summary;
DELIMITER $$
CREATE PROCEDURE sp_delivery_earnings_summary(IN p_start_date DATE, IN p_end_date DATE)
BEGIN
  SELECT
    de.driverId,
    u.fullName AS driverName,
    COUNT(*) AS completedDeliveries,
    SUM(de.baseEarnings) AS baseEarnings,
    SUM(de.distanceBonus) AS distanceBonus,
    SUM(de.onTimeBonus) AS onTimeBonus,
    SUM(de.performanceBonus) AS performanceBonus,
    SUM(de.specialHandlingBonus) AS specialHandlingBonus,
    SUM(de.deductions) AS deductions,
    SUM(de.totalEarnings) AS totalEarnings
  FROM delivery_earnings de
  INNER JOIN users u ON u.id = de.driverId
  WHERE de.earnedDate BETWEEN p_start_date AND p_end_date
  GROUP BY de.driverId, u.fullName
  ORDER BY totalEarnings DESC;
END$$
DELIMITER ;