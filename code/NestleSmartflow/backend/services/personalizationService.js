const db = require('../db');

class PersonalizationService {
    /**
     * Get Smart Reorder Suggestions based on order frequency
     * @param {number} retailerId 
     * @returns {Promise<Array>} List of product suggestions
     */
    static async getSmartReorderSuggestions(retailerId) {
        // Find average days between orders for each product for this retailer
        const query = `
            SELECT 
                oi.product_id,
                p.name,
                p.unit,
                COUNT(o.id) as order_count,
                MAX(o.created_at) as last_ordered_at,
                DATEDIFF(MAX(o.created_at), MIN(o.created_at)) / NULLIF(COUNT(o.id) - 1, 0) as avg_days_between_orders
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.retailer_id = ?
            GROUP BY oi.product_id, p.name, p.unit
            HAVING order_count > 1
        `;

        const [rows] = await db.query(query, [retailerId]);

        const suggestions = rows.map(row => {
            const lastOrdered = new Date(row.last_ordered_at);
            const now = new Date();
            const daysSinceLastOrder = (now - lastOrdered) / (1000 * 60 * 60 * 24);
            
            // If the time since last order is close to or exceeds the average order interval, suggest reorder
            const isDueForReorder = daysSinceLastOrder >= (row.avg_days_between_orders - 2); // 2 days buffer
            
            return {
                ...row,
                daysSinceLastOrder: Math.round(daysSinceLastOrder),
                isDueForReorder,
                reorderProbability: isDueForReorder ? 'High' : 'Medium'
            };
        }).filter(item => item.isDueForReorder);

        return suggestions;
    }

    /**
     * Get Personalized Product List (Frequently ordered + Recently ordered)
     * @param {number} retailerId 
     * @returns {Promise<Object>} Object containing frequently ordered and recently ordered products
     */
    static async getPersonalizedProductList(retailerId) {
        // Top Products (By volume)
        const freqQuery = `
            SELECT oi.product_id, p.name, p.unit, SUM(oi.quantity) as total_qty
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE o.retailer_id = ?
            GROUP BY oi.product_id, p.name, p.unit
            ORDER BY total_qty DESC
            LIMIT 5
        `;
        const [frequentProducts] = await db.query(freqQuery, [retailerId]);

        // Recently Ordered
        const recentQuery = `
            SELECT oi.product_id, p.name, p.unit
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE o.retailer_id = ?
            GROUP BY oi.product_id, p.name, p.unit
            ORDER BY MAX(o.created_at) DESC
            LIMIT 5
        `;
        const [recentProducts] = await db.query(recentQuery, [retailerId]);

        return {
            frequent: frequentProducts,
            recent: recentProducts
        };
    }

    /**
     * Calculate Retailer Behaviour Score
     * @param {number} retailerId 
     * @returns {Promise<Object>} Score details and categorization
     */
    static async getRetailerScore(retailerId) {
        const query = `
            SELECT 
                COUNT(id) as total_orders,
                SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) as paid_orders,
                MIN(created_at) as first_order_date,
                MAX(created_at) as last_order_date
            FROM orders
            WHERE retailer_id = ?
        `;
        const [rows] = await db.query(query, [retailerId]);
        const data = rows[0];

        if (!data || data.total_orders === 0) {
            return {
                score: 0,
                category: 'New/Inactive',
                metrics: { total_orders: 0, payment_reliability: 0, order_frequency: 0 }
            };
        }

        const totalOrders = data.total_orders;
        const paidOrders = data.paid_orders || 0;
        
        // Payment Reliability (0 to 50 points)
        const paymentRatio = paidOrders / totalOrders;
        const paymentPoints = paymentRatio * 50;

        // Order Frequency (0 to 50 points)
        const firstOrder = new Date(data.first_order_date);
        const lastOrder = new Date(data.last_order_date);
        let daysActive = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24);
        if (daysActive < 1) daysActive = 1; // Minimum 1 day

        const monthsActive = Math.max(1, daysActive / 30);
        const ordersPerMonth = totalOrders / monthsActive;
        
        // Let's say 4 orders a month (1 per week) is perfect (50 points)
        const frequencyPoints = Math.min(50, (ordersPerMonth / 4) * 50);

        const totalScore = Math.round(paymentPoints + frequencyPoints);
        
        let category = 'Irregular';
        if (totalScore >= 80) category = 'High Value';
        else if (totalScore >= 50) category = 'Regular';

        return {
            score: totalScore,
            category,
            metrics: {
                total_orders: totalOrders,
                payment_reliability: Math.round(paymentRatio * 100) + '%',
                orders_per_month: ordersPerMonth.toFixed(1)
            }
        };
    }
}

module.exports = PersonalizationService;
