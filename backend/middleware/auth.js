const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get the token from the header
    const token = req.header('x-auth-token');

    // 2. Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // 3. Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Add the user to the request
        next(); // Move to the next step (marking attendance)
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};