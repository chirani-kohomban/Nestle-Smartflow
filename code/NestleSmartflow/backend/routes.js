const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verifyToken } = require('./middleware'); // Assuming verifyToken is standard
const PersonalizationService = require('./services/personalizationService');

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

        if (!['NESTLE_MANAGER', 'AREA_MANAGER', 'ADMIN', 'WAREHOUSE', 'DISTRIBUTOR', 'RETAILER'].includes(role)) {
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

        if (role === 'RETAILER') {
            if (req.body.retailer_id) {
                const [linkResult] = await connection.query(
                    'UPDATE retailers SET user_id = ? WHERE id = ?',
                    [result.insertId, req.body.retailer_id]
                );

                if (linkResult.affectedRows === 0) {
                    return res.status(400).json({ message: 'Invalid retailer_id provided' });
                }
            } else {
                // Auto-create a basic retailer profile when no existing retailer is selected.
                // This prevents "retailer profile not found" after successful retailer signup.
                await connection.query(
                    'INSERT INTO retailers (name, address, lat, lng, user_id) VALUES (?, ?, ?, ?, ?)',
                    [username, 'Pending address', 0, 0, result.insertId]
                );
            }
        }

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
        if (inv.length === 0) return res.status(404).json({ message: 'Product not found in inventory.' });

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

// SPRINT 3: Order Adjustments & Settlement
router.post('/orders/:id/adjust', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { items } = req.body; // Array of { id: order_item_id, quantity }
        const orderId = req.params.id;

        const [order] = await connection.query('SELECT locked FROM orders WHERE id = ?', [orderId]);
        if (order.length === 0 || order[0].locked) {
            throw new Error('Order is locked or does not exist');
        }

        for (const item of items) {
            await connection.query(
                'UPDATE order_items SET quantity = ? WHERE id = ? AND order_id = ?',
                [item.quantity, item.id, orderId]
            );
        }
        await connection.commit();
        res.json({ message: 'Order adjusted' });
    } catch (err) {
        await connection.rollback();
        res.status(400).json({ message: err.message });
    } finally {
        connection.release();
    }
});

router.post('/orders/:id/lock', verifyToken, async (req, res) => {
    try {
        const { total_amount } = req.body;
        await db.query('UPDATE orders SET locked = TRUE, total_amount = ? WHERE id = ?', [total_amount, req.params.id]);
        res.json({ message: 'Order locked' });
    } catch (err) {
        res.status(500).json({ message: 'Error locking order' });
    }
});

router.post('/orders/:id/settle', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const orderId = req.params.id;
        const { method, amount, distributor_signature, retailer_signature, delivery_id } = req.body;

        let { cheque_number, bank_name, cheque_date } = req.body;
        cheque_number = (cheque_number && cheque_number.trim() !== '') ? cheque_number : null;
        bank_name = (bank_name && bank_name.trim() !== '') ? bank_name : null;
        cheque_date = (cheque_date && cheque_date.trim() !== '') ? cheque_date : null;

        await connection.query(
            `INSERT INTO payments (order_id, method, amount, cheque_number, bank_name, cheque_date, distributor_signature, retailer_signature)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderId, method, amount, cheque_number, bank_name, cheque_date, distributor_signature, retailer_signature]
        );

        let payment_status = method === 'PAY_LATER' ? 'UNPAID' : 'PAID';

        await connection.query(
            "UPDATE orders SET payment_status = ?, status = 'DELIVERED' WHERE id = ?",
            [payment_status, orderId]
        );

        await connection.query(
            "UPDATE deliveries SET status = 'DELIVERED', delivery_time = NOW() WHERE id = ?",
            [delivery_id]
        );

        // Auto-release distributor if no more assigned deliveries
        const [del] = await connection.query('SELECT distributor_id FROM deliveries WHERE id = ?', [delivery_id]);
        if (del.length > 0) {
            const distId = del[0].distributor_id;
            const [active] = await connection.query(
                "SELECT id FROM deliveries WHERE distributor_id = ? AND status = 'ASSIGNED'",
                [distId]
            );
            if (active.length === 0) {
                await connection.query("UPDATE distributor_profiles SET status = 'AVAILABLE' WHERE user_id = ?", [distId]);
            }
        }

        await connection.commit();
        res.json({ message: 'Settlement complete' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: 'Error during settlement' });
    } finally {
        connection.release();
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
// POST /auto-dispatch -> Allocate stock and auto-assign closest distributor
router.post('/auto-dispatch', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { order_id } = req.body;

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

        // 3. Find AVAILABLE distributor
        // Priority:
        //   1) Area-based username match (e.g. retailer "shop_galle" -> distributor "distributor_galle")
        //   2) Fallback to nearest distributor by GPS
        const [order] = await connection.query(`
            SELECT r.lat, r.lng, ru.username AS retailer_username
            FROM orders o 
            JOIN retailers r ON o.retailer_id = r.id 
            LEFT JOIN users ru ON ru.id = r.user_id
            WHERE o.id = ?`, [order_id]);

        if (order.length === 0) throw new Error('Order or retailer not found');
        const retLat = order[0].lat;
        const retLng = order[0].lng;
        const retailerUsername = (order[0].retailer_username || '').toLowerCase();

        const [distributors] = await connection.query(`
            SELECT dp.user_id, dp.current_lat, dp.current_lng, u.username
            FROM distributor_profiles dp
            JOIN users u ON u.id = dp.user_id
            WHERE dp.status = 'AVAILABLE' AND u.role = 'DISTRIBUTOR'
        `);

        if (distributors.length === 0) {
            throw new Error('No distributors are currently available. Please wait for a courier to come online.');
        }

        let bestDistributorId = null;
        let assignmentMode = 'NEAREST';
        let minDistance = Infinity;

        // Try area-based assignment first using suffix after first underscore.
        // Examples:
        //   retailer: shop_galle           -> area token: galle
        //   retailer: store_colombo_south  -> area token: colombo_south
        const retailerParts = retailerUsername.split('_').filter(Boolean);
        const areaToken = retailerParts.length > 1 ? retailerParts.slice(1).join('_') : null;

        if (areaToken) {
            const matchedDistributor = distributors.find(d => {
                const dUsername = (d.username || '').toLowerCase();
                return dUsername.endsWith(`_${areaToken}`);
            });

            if (matchedDistributor) {
                bestDistributorId = matchedDistributor.user_id;
                assignmentMode = 'AREA_MATCH';
            }
        }

        if (!bestDistributorId) {
            for (const d of distributors) {
                if (d.current_lat && d.current_lng) {
                    const dist = getDistance(retLat, retLng, d.current_lat, d.current_lng);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestDistributorId = d.user_id;
                    }
                } else {
                    // If they don't have location yet, assign them as fallback
                    if (!bestDistributorId) bestDistributorId = d.user_id;
                }
            }
        }

        if (!bestDistributorId) throw new Error('Could not determine a valid distributor.');

        // 4. Update order status to DISPATCHED
        await connection.query("UPDATE orders SET status = 'DISPATCHED' WHERE id = ?", [order_id]);

        // 5. Create delivery
        await connection.query(
            "INSERT INTO deliveries (order_id, distributor_id, status) VALUES (?, ?, 'ASSIGNED')",
            [order_id, bestDistributorId]
        );

        // 6. Update distributor status to ON_ROUTE
        await connection.query("UPDATE distributor_profiles SET status = 'ON_ROUTE' WHERE user_id = ?", [bestDistributorId]);

        await connection.commit();
        res.json({
            message: 'Order auto-dispatched successfully',
            assignedDistributor: bestDistributorId,
            assignmentMode
        });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(400).json({ message: err.message || 'Error dispatching order' });
    } finally {
        connection.release();
    }
});

router.get('/distributors/status', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.username, dp.status 
            FROM users u 
            JOIN distributor_profiles dp ON u.id = dp.user_id 
            WHERE u.role = 'DISTRIBUTOR'
         `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching distributors' });
    }
});

router.post('/distributor/status', verifyToken, async (req, res) => {
    try {
        const { status, lat, lng } = req.body;
        // Make sure it exists first
        const [existing] = await db.query("SELECT id FROM distributor_profiles WHERE user_id = ?", [req.user.id]);
        if (existing.length === 0) {
            await db.query(
                "INSERT INTO distributor_profiles (user_id, status, current_lat, current_lng) VALUES (?, ?, ?, ?)",
                [req.user.id, status, lat, lng]
            );
        } else {
            await db.query(
                "UPDATE distributor_profiles SET status = ?, current_lat = ?, current_lng = ? WHERE user_id = ?",
                [status, lat, lng, req.user.id]
            );
        }
        res.json({ message: 'Status updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating status' });
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
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

// SPRINT 3: GPS Arrival
router.post('/deliveries/arrive', verifyToken, async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const [nearby] = await db.query(`
            SELECT d.id as delivery_id, r.id as retailer_id, r.name, r.address, r.lat, r.lng, o.id as order_id
            FROM deliveries d
            JOIN orders o ON d.order_id = o.id
            JOIN retailers r ON o.retailer_id = r.id
            WHERE d.distributor_id = ? AND d.status = 'ASSIGNED'
        `, [req.user.id]);

        const R = 6371; // km
        const nearbyRetailers = nearby.filter(ret => {
            const dLat = (ret.lat - lat) * Math.PI / 180;
            const dLon = (ret.lng - lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(ret.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance < 500; // within 500km radius for MVP testing, realistically ~1-5km
        });

        res.json({ nearby: nearbyRetailers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching nearby retailers' });
    }
});

router.post('/deliveries/:id/start-session', verifyToken, async (req, res) => {
    try {
        const { lat, lng } = req.body;
        await db.query(
            "UPDATE deliveries SET arrived_at = NOW(), arrival_lat = ?, arrival_lng = ? WHERE id = ?",
            [lat, lng, req.params.id]
        );
        res.json({ message: 'Session started' });
    } catch (err) {
        res.status(500).json({ message: 'Error starting session' });
    }
});

// SPRINT 3: Retailer Dashboard
router.get('/retailer/dashboard', verifyToken, async (req, res) => {
    try {
        const [retailer] = await db.query('SELECT id FROM retailers WHERE user_id = ?', [req.user.id]);
        if (retailer.length === 0) return res.status(404).json({ message: 'Retailer profile not found' });

        const retailerId = retailer[0].id;

        const [deliveries] = await db.query(`
            SELECT d.id as delivery_id, d.status as delivery_status,
                   o.id as order_id, o.payment_status, o.total_amount, o.locked, d.delivery_time, d.arrived_at
            FROM deliveries d
            JOIN orders o ON d.order_id = o.id
            WHERE o.retailer_id = ?
            ORDER BY d.created_at DESC
        `, [retailerId]);

        for (let del of deliveries) {
            const [items] = await db.query(`
                SELECT oi.*, p.name as product_name, p.unit
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [del.order_id]);
            del.items = items;

            const [payments] = await db.query('SELECT * FROM payments WHERE order_id = ?', [del.order_id]);
            del.payment = payments.length > 0 ? payments[0] : null;
        }

        res.json({ deliveries, retailer_id: retailerId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching retailer dashboard' });
    }
});

// SPRINT 3: Area Manager expanded retailers view
router.get('/area-manager/retailers', verifyToken, async (req, res) => {
    try {
        const [retailers] = await db.query(`
            SELECT r.*, 
                COUNT(DISTINCT o.id) as total_orders,
                SUM(CASE WHEN o.payment_status = 'UNPAID' AND o.total_amount IS NOT NULL THEN o.total_amount ELSE 0 END) as outstanding_balance,
                SUM(CASE WHEN p.method = 'PAY_LATER' THEN 1 ELSE 0 END) as pending_payments_count
            FROM retailers r
            LEFT JOIN orders o ON r.id = o.retailer_id
            LEFT JOIN payments p ON o.id = p.order_id
            GROUP BY r.id
        `);
        res.json(retailers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching area manager retailers' });
    }
});

// --- PERSONALIZATION MODULE ---
async function getRetailerIdFromReq(req) {
    if (req.query.retailerId) {
        return parseInt(req.query.retailerId, 10);
    }
    if (req.user.role === 'RETAILER') {
        const [retailer] = await db.query('SELECT id FROM retailers WHERE user_id = ?', [req.user.id]);
        if (retailer.length > 0) return retailer[0].id;
    }
    return null;
}

router.get('/personalization/reorder-suggestions', verifyToken, async (req, res) => {
    try {
        const retailerId = await getRetailerIdFromReq(req);
        if (!retailerId) return res.status(400).json({ message: 'Retailer ID required' });
        
        const suggestions = await PersonalizationService.getSmartReorderSuggestions(retailerId);
        res.json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching reorder suggestions' });
    }
});

router.get('/personalization/product-list', verifyToken, async (req, res) => {
    try {
        const retailerId = await getRetailerIdFromReq(req);
        if (!retailerId) return res.status(400).json({ message: 'Retailer ID required' });

        const productList = await PersonalizationService.getPersonalizedProductList(retailerId);
        res.json(productList);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching personalized product list' });
    }
});

router.get('/personalization/score', verifyToken, async (req, res) => {
    try {
        const retailerId = await getRetailerIdFromReq(req);
        if (!retailerId) return res.status(400).json({ message: 'Retailer ID required' });

        const score = await PersonalizationService.getRetailerScore(retailerId);
        res.json(score);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching retailer score' });
    }
});

module.exports = router;
