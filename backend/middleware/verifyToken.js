const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {

    const token = req.cookies.token;

    if (!token)
        return res.status(401).json({ error: 'No token found' });

    try {

        const decoded = jwt.verify(token, jwtSecret);

        req.user = decoded;

        next();

    } catch {

        return res.status(403).json({ error: 'Invalid token' });

    }

};

module.exports = verifyToken;