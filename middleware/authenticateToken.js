// middleware/authenticateToken.js
import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token yo‘q' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.user_id;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token noto‘g‘ri' });
  }
};

export default authenticateToken;
