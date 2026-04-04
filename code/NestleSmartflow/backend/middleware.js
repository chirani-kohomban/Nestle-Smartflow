const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        
        jwt.verify(bearerToken, process.env.JWT_SECRET || 'supersecretjwtkey_for_student_project', (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Failed to authenticate token', error: err });
            }
            // Save decoded user info to request for use in other routes
            req.user = decoded;
            next();
        });
    } else {
        // Forbidden
        res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

const requireStaff = (req, res, next) => {
    if (req.user && req.user.role === 'STAFF') {
        next();
    } else {
        res.status(403).json({ message: 'Warehouse Staff access required' });
    }
};

module.exports = { verifyToken, requireAdmin, requireStaff };
