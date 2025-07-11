const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to like products.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Forbidden. Invalid token.' });
    }

    if (!decoded?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Invalid user data in token.' });
    }

    req.user = {
      userId: decoded.user.id
    };

    next();
  });
};

module.exports = { authenticateUser };
