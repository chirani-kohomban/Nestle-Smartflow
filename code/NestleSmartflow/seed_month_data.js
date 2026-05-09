const db = require('./backend/db');

async function seedMonthData() {
    const connection = await db.getConnection();
    try {
        console.log("Starting to seed a month of data...");
        await connection.beginTransaction();

        // 1. Fetch all retailers
        const [retailers] = await connection.query('SELECT id FROM retailers');
        if (retailers.length === 0) {
            console.log("No retailers found. Exiting.");
            process.exit(0);
        }

        // 2. Fetch all products
        const [products] = await connection.query('SELECT id FROM products');
        if (products.length === 0) {
            console.log("No products found. Exiting.");
            process.exit(0);
        }

        let totalOrdersCreated = 0;

        // 3. Generate data for each retailer
        for (const retailer of retailers) {
            // Give each retailer between 4 to 8 orders over the last month
            const numOrders = Math.floor(Math.random() * 5) + 4; 

            for (let i = 0; i < numOrders; i++) {
                // Random day between 1 and 30 days ago
                const daysAgo = Math.floor(Math.random() * 30) + 1;
                
                // Random payment status (80% PAID)
                const isPaid = Math.random() > 0.2;
                const paymentStatus = isPaid ? 'PAID' : 'UNPAID';
                
                // Create order
                const [orderResult] = await connection.query(`
                    INSERT INTO orders (retailer_id, status, payment_status, total_amount, created_at) 
                    VALUES (?, 'DELIVERED', ?, 0, DATE_SUB(NOW(), INTERVAL ? DAY))
                `, [retailer.id, paymentStatus, daysAgo]);
                
                const orderId = orderResult.insertId;
                let orderTotal = 0;

                // Select 1 to 3 random products for this order
                const numProducts = Math.floor(Math.random() * 3) + 1;
                const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
                const selectedProducts = shuffledProducts.slice(0, numProducts);

                for (const product of selectedProducts) {
                    const quantity = Math.floor(Math.random() * 10) + 1;
                    const priceEst = quantity * 1500; // Fake unit price for amount calculation
                    orderTotal += priceEst;

                    await connection.query(`
                        INSERT INTO order_items (order_id, product_id, quantity) 
                        VALUES (?, ?, ?)
                    `, [orderId, product.id, quantity]);
                }

                // Update total_amount in order
                await connection.query(`
                    UPDATE orders SET total_amount = ? WHERE id = ?
                `, [orderTotal, orderId]);

                // If paid, add a payment record
                if (isPaid) {
                    const methods = ['CASH', 'CHEQUE'];
                    const method = methods[Math.floor(Math.random() * methods.length)];
                    await connection.query(`
                        INSERT INTO payments (order_id, method, amount, created_at) 
                        VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
                    `, [orderId, method, orderTotal, daysAgo]);
                }

                totalOrdersCreated++;
            }
        }

        await connection.commit();
        console.log(`Successfully generated ${totalOrdersCreated} orders over the last 30 days for ${retailers.length} retailers!`);
        
    } catch (err) {
        await connection.rollback();
        console.error("Error seeding data:", err);
    } finally {
        connection.release();
        process.exit(0);
    }
}

seedMonthData();
