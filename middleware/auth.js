// middleware/auth.js
import jwt from 'jsonwebtoken';

const authenticate = (socket, next) => {
  const { token, lessonId } = socket.handshake.auth;
  if (!token || !lessonId) {
    return next(new Error('Token yoki lessonId yo‘q'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId   = decoded.user_id;
    socket.lessonId = lessonId;
    socket.token    = token;
    next();
  } catch (err) {
    return next(new Error('Token noto‘g‘ri'));
  }
};

export default authenticate;
