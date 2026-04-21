const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verifyToken } = require('./middleware'); // Assuming verifyToken is standard

// --- AUTHENTICATION ---
// POST /login -> Authenticate user, return role
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'supersecretjwtkey_for_student_project',
            { expiresIn: '12h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /register -> Register a new user
router.post('/register', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { username, password, role } = req.body;
        
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (!['NESTLE_MANAGER', 'AREA_MANAGER', 'ADMIN', 'WAREHOUSE', 'DISTRIBUTOR'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Check if user exists
        const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        
        const [result] = await connection.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, hash, role]
        );

        // Auto-login after registration (optional, but convenient)
        const token = jwt.sign(
            { id: result.insertId, username, role },
            process.env.JWT_SECRET || 'supersecretjwtkey_for_student_project',
            { expiresIn: '12h' }
        );

        res.status(201).json({ 
            message: 'Registered successfully',
            token, 
            user: { id: result.insertId, username, role } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration' });
    } finally {
        connection.release();
    }
});

// --- RETAILERS ---
router.get('/retailers', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM retailers');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching retailers' });
    }
});

router.post('/retailers', verifyToken, async (req, res) => {
    try {
        const { name, address, lat, lng } = req.body;
        const [result] = await db.query(
            'INSERT INTO retailers (name, address, lat, lng) VALUES (?, ?, ?, ?)',
            [name, address, lat, lng]
        );
        res.status(201).json({ message: 'Retailer created', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating retailer' });
    }
});

// --- PRODUCTS & INVENTORY ---
router.get('/products', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, i.quantity 
            FROM products p 
            LEFT JOIN inventory i ON p.id = i.product_id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Warehouse adjust stock manual entry
router.post('/inventory/adjust', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { product_id, quantity_change } = req.body;
        
        // Ensure negative changes do not drop stock securely
        const [inv] = await connection.query('SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE', [product_id]);
        if (inv.length === 0) return res.status(404).json({ message: 'Product not found in inventory.'});
        
        const currentQty = parseInt(inv[0].quantity) || 0;
        const finalQty = currentQty + parseInt(quantity_change);
        
        if (finalQty < 0) {
            throw new Error(`Cannot reduce stock below 0. Current stock is ${currentQty}.`);
        }

        await connection.query(
            'UPDATE inventory SET quantity = ?, last_updated_by = ? WHERE product_id = ?',
            [finalQty, req.user.id, product_id]
        );
        
        await connection.commit();
        res.json({ message: 'Stock adjusted successfully', newQuantity: finalQty });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(400).json({ message: err.message || 'Error adjusting stock' });
    } finally {
        connection.release();
    }
});

// Admin add new product
router.post('/products', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { name, sku, unit, initialQuantity } = req.body;
        
        const [prodResult] = await connection.query(
            'INSERT INTO products (name, sku, unit) VALUES (?, ?, ?)',
            [name, sku, unit]
        );
        const productId = prodResult.insertId;
        
        await connection.query(
            'INSERT INTO inventory (product_id, quantity) VALUES (?, ?)',
            [productId, parseInt(initialQuantity) || 0]
        );
        
        await connection.commit();
        res.status(201).json({ message: 'Product created', id: productId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: 'Error creating product' });
    } finally {
        connection.release();
    }
});

// Admin update product
router.put('/products/:id', verifyToken, async (req, res) => {
    try {
        const { name, sku, unit } = req.body;
        await db.query(
            'UPDATE products SET name = ?, sku = ?, unit = ? WHERE id = ?',
            [name, sku, unit, req.params.id]
        );
        res.json({ message: 'Product updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating product' });
    }
});

// Admin delete product
router.delete('/products/:id', verifyToken, async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// --- ORDERS ---
// GET /orders -> List orders
router.get('/orders', verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT o.*, r.name as retailer_name, u.username as manager_name 
            FROM orders o
            LEFT JOIN retailers r ON o.retailer_id = r.id
            LEFT JOIN users u ON o.manager_id = u.id
            ORDER BY o.created_at DESC
        `;
        const [rows] = await db.query(sql);
        
        // Fetch order items manually for simplicity
        for (let row of rows) {
            const [items] = await db.query(`
                SELECT oi.*, p.name as product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [row.id]);
            row.items = items;
        }

        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// POST /orders -> Create new order
router.post('/orders', verifyToken, async (req, res) => {
    // Expected: { retailer_id: 1, items: [{ product_id: 1, quantity: 10 }] }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { retailer_id, items } = req.body;

        const [orderResult] = await connection.query(
            'INSERT INTO orders (manager_id, retailer_id) VALUES (?, ?)',
            [req.user.id, retailer_id]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
                [orderId, item.product_id, item.quantity]
            );
        }

        await connection.commit();
        res.json({ message: 'Order created', orderId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: 'Error creating order' });
    } finally {
        connection.release();
    }
});

// GET /orders/recommendation/:retailerId -> Get average of last 3 orders for a retailer
router.get('/orders/recommendation/:retailerId', verifyToken, async (req, res) => {
    try {
        const { retailerId } = req.params;
        // Get last 3 orders for this retailer
        const [orders] = await db.query(
            'SELECT id FROM orders WHERE retailer_id = ? ORDER BY created_at DESC LIMIT 3',
            [retailerId]
        );

        if (orders.length === 0) {
             return res.json({ message: 'No past orders to recommend from', recommendations: [] });
        }

        const orderIds = orders.map(o => o.id);
        // Average product quantities
        const [items] = await db.query(`
            SELECT product_id, p.name as product_name, AVG(quantity) as avg_quantity
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE order_id IN (?)
            GROUP BY product_id
        `, [orderIds]);

        const recs = items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            recommended_quantity: Math.ceil(item.avg_quantity)
        }));

        res.json({ recommendations: recs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching recommendations' });
    }
});

// --- DISPATCH (WAREHOUSE) ---
// POST /dispatch -> Allocate stock and create delivery
router.post('/dispatch', verifyToken, async (req, res) => {
    // Expected: { order_id: 1, distributor_id: 3 }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { order_id, distributor_id } = req.body;

        // 1. Get order items
        const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order_id]);
        
        // 2. Check and reduce inventory
        for (const item of items) {
            const [inv] = await connection.query('SELECT id, quantity FROM inventory WHERE product_id = ? FOR UPDATE', [item.product_id]);
            if (inv.length === 0 || inv[0].quantity < item.quantity) {
                throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
            }
            await connection.query('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?', [item.quantity, item.product_id]);
        }

        // 3. Update order status to DISPATCHED
        await connection.query("UPDATE orders SET status = 'DISPATCHED' WHERE id = ?", [order_id]);

        // 4. Create delivery
        await connection.query(
            "INSERT INTO deliveries (order_id, distributor_id, status) VALUES (?, ?, 'ASSIGNED')",
            [order_id, distributor_id]
        );

        await connection.commit();
        res.json({ message: 'Order dispatched successfully' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(400).json({ message: err.message || 'Error dispatching order' });
    } finally {
        connection.release();
    }
});

router.get('/distributors', verifyToken, async (req, res) => {
    try {
         const [rows] = await db.query("SELECT id, username FROM users WHERE role = 'DISTRIBUTOR'");
         res.json(rows);
    } catch (err) {
         res.status(500).json({ message: 'Error fetching distributors' });
    }
});

// --- DELIVERIES (DISTRIBUTOR) ---
// GET /deliveries -> Fetch deliveries for logged in distributor
router.get('/deliveries', verifyToken, async (req, res) => {
    try {
        const distributor_id = req.user.id;
        let sql = `
            SELECT d.id as delivery_id, d.status as delivery_status,
                   o.id as order_id, o.payment_status,
                   r.name as retailer_name, r.address, r.lat, r.lng
            FROM deliveries d
            JOIN orders o ON d.order_id = o.id
            JOIN retailers r ON o.retailer_id = r.id
        `;
        const params = [];
        // If not manager or warehouse, see only own
        if (req.user.role === 'DISTRIBUTOR') {
             sql += ` WHERE d.distributor_id = ? ORDER BY d.delivery_order ASC, d.id ASC`;
             params.push(distributor_id);
        } else {
             sql += ` ORDER BY d.created_at DESC`;
        }

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching deliveries' });
    }
});

// POST /deliveries/update-status -> Mark as DELIVERED
router.post('/deliveries/update-status', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { delivery_id } = req.body;

        await connection.query(
            "UPDATE deliveries SET status = 'DELIVERED', delivery_time = NOW() WHERE id = ?",
            [delivery_id]
        );

        // Mark order as Delivered and Paid
        const [del] = await connection.query('SELECT order_id FROM deliveries WHERE id = ?', [delivery_id]);
        if (del.length > 0) {
            await connection.query(
                "UPDATE orders SET status = 'DELIVERED', payment_status = 'PAID' WHERE id = ?",
                [del[0].order_id]
            );
        }

        await connection.commit();
        res.json({ message: 'Delivery marked as complete and order paid' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: 'Error updating delivery status' });
    } finally {
        connection.release();
    }
});

// --- ROUTE OPTIMIZATION ---
// Simple nearest neighbor starting from a dummy warehouse location
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
}

router.get('/route', verifyToken, async (req, res) => {
    try {
        const distributor_id = req.user.id;
        
        // Get pending deliveries for distributor
        const [deliveries] = await db.query(`
            SELECT d.id as delivery_id, r.id as retailer_id, r.name, r.address, r.lat, r.lng
            FROM deliveries d
            JOIN orders o ON d.order_id = o.id
            JOIN retailers r ON o.retailer_id = r.id
            WHERE d.distributor_id = ? AND d.status = 'ASSIGNED'
        `, [distributor_id]);

        if (deliveries.length === 0) return res.json({ route: [] });

        // Warehouse start location (dummy coord, e.g., Colombo SL)
        const warehouse = { lat: 6.9271, lng: 79.8612 };
        
        let path = [];
        let currentLocation = warehouse;
        let unvisited = [...deliveries];

        // Nearest Neighbor Logic
        while (unvisited.length > 0) {
            let nearestIdx = 0;
            let minDistance = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const dist = getDistance(
                    currentLocation.lat, currentLocation.lng,
                    unvisited[i].lat, unvisited[i].lng
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestIdx = i;
                }
            }

            const nextStop = unvisited.splice(nearestIdx, 1)[0];
            path.push(nextStop);
            currentLocation = nextStop;
        }

        // Update database with sequence to save it
        for (let i = 0; i < path.length; i++) {
            await db.query('UPDATE deliveries SET delivery_order = ? WHERE id = ?', [i + 1, path[i].delivery_id]);
        }

        res.json({ message: 'Route optimized', route: path });

    } catch (err) {
        console.error(err);
         res.status(500).json({ message: 'Error calculating route' });
    }
});

module.exports = router;
