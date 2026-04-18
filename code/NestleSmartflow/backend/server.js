require('dotenv').config();
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'UP', db: 'Connected' });
    } catch (err) {
        res.status(500).json({ status: 'DOWN', db: 'Disconnected', error: err.message });
    }
});

// Start Server (Only if not running in Vercel Serverless)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`SmartFlow Server running on port ${PORT}`);
    });
}

module.exports = app;
