const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verifyToken, requireAdmin, requireStaff } = require('./middleware');

// --- AUTHENTICATION ---

// POST /api/login -> Authenticate user, return JWT
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET || 'supersecretjwtkey_for_student_project',
            { expiresIn: '12h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});


// --- PRODUCTS & INVENTORY ---

// GET /api/products -> List all products
router.get('/products', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// GET /api/products/:id -> Get single product inventory
router.get('/products/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [productRows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        
        if (productRows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const [inventoryRows] = await db.query('SELECT quantity FROM inventory WHERE product_id = ?', [id]);
        
        res.json({
            ...productRows[0],
            inventory: inventoryRows.length > 0 ? inventoryRows[0].quantity : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// POST /api/products -> Add new product (Admin Only)
router.post('/products', verifyToken, requireAdmin, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { name, sku, unit, initialQuantity } = req.body;
        
        if (!name || !sku || !unit) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Insert into products
        const [productResult] = await connection.query(
            'INSERT INTO products (name, sku, unit) VALUES (?, ?, ?)',
            [name, sku, unit]
        );
        
        const productId = productResult.insertId;
        const startQty = initialQuantity ? parseInt(initialQuantity) : 0;

        // Automatically create inventory entry
        await connection.query(
            'INSERT INTO inventory (product_id, quantity, last_updated_by) VALUES (?, ?, ?)',
            [productId, startQty, req.user.id]
        );

        await connection.commit();
        res.status(201).json({ message: 'Product created successfully', productId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
             res.status(409).json({ message: 'SKU already exists' });
        } else {
             res.status(500).json({ message: 'Server error creating product' });
        }
    } finally {
        connection.release();
    }
});

// PUT /api/products/:id -> Update product (Admin Only)
router.put('/products/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sku, unit } = req.body;
        
        if (!name || !sku || !unit) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        await db.query(
            'UPDATE products SET name = ?, sku = ?, unit = ? WHERE id = ?',
            [name, sku, unit, id]
        );
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
             res.status(409).json({ message: 'SKU already exists' });
        } else {
             res.status(500).json({ message: 'Server error updating product' });
        }
    }
});

// DELETE /api/products/:id -> Delete a product (Admin Only)
router.delete('/products/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
});

// PUT /api/products/:id/stock -> Update stock quantity (INCREMENT/DECREMENT via delta) - STAFF ONLY
router.put('/products/:id/stock', verifyToken, requireStaff, async (req, res) => {
    try {
        const { id } = req.params;
        const { delta, movementType } = req.body; // delta should be a number (positive for IN, negative for OUT)
        
        if (!delta || isNaN(delta)) {
            return res.status(400).json({ message: 'Valid quantity delta is required' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const [rows] = await connection.query('SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE', [id]);
            
            let newQty = 0;
            if (rows.length === 0) {
                newQty = parseInt(delta);
                await connection.query(
                    'INSERT INTO inventory (product_id, quantity, last_updated_by) VALUES (?, ?, ?)',
                    [id, newQty, req.user.id]
                );
            } else {
                const currentQty = rows[0].quantity;
                newQty = currentQty + parseInt(delta);
                
                if (newQty < 0) {
                     await connection.rollback();
                     return res.status(400).json({ message: 'Insufficient stock. Transaction cannot result in negative inventory.' });
                }

                await connection.query(
                    'UPDATE inventory SET quantity = ?, last_updated_by = ? WHERE product_id = ?',
                    [newQty, req.user.id, id]
                );
            }
            
            // Insert log
            await connection.query(
                'INSERT INTO inventory_logs (product_id, user_id, quantity_change, stock_after, action_type) VALUES (?, ?, ?, ?, ?)',
                [id, req.user.id, parseInt(delta), newQty, movementType]
            );
            
            await connection.commit();
            res.json({ message: 'Stock updated successfully' });
        } catch(txnErr) {
            await connection.rollback();
            throw txnErr;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update stock' });
    }
});

// GET /api/inventory -> Return full inventory dashboard
router.get('/inventory', verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.id, 
                p.sku, 
                p.name, 
                p.unit, 
                IFNULL(i.quantity, 0) as quantity,
                u.username as last_updated_by_user,
                i.last_updated_at
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            LEFT JOIN users u ON i.last_updated_by = u.id
            ORDER BY p.id DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to load inventory dashboard' });
    }
});

// GET /api/reports -> Analytics data for Management
router.get('/reports', verifyToken, async (req, res) => {
    try {
        // Daily shipments logic -> Group by date where action_type='OUT'
        const sqlShipments = `
            SELECT DATE(created_at) as date, ABS(SUM(quantity_change)) as total_shipped
            FROM inventory_logs 
            WHERE action_type = 'OUT'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 7
        `;
        // Product Distribution logic
        const sqlDistribution = `
            SELECT p.name, IFNULL(i.quantity, 0) as quantity
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE i.quantity > 0
        `;
        
        const [shipments] = await db.query(sqlShipments);
        const [distribution] = await db.query(sqlDistribution);
        
        // Reverse shipments to be chronological
        res.json({
            shipments: shipments.reverse(),
            distribution
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to load reports' });
    }
});

module.exports = router;
