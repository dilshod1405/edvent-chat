import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token yo‘q' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded.user_id kabi keyinchalik ishlatish uchun
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token noto‘g‘ri' });
  }
};

export default authenticateToken;
