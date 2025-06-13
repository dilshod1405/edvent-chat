import jwt from 'jsonwebtoken';

export default function authenticate(socket, next) {
  const { token, lessonId } = socket.handshake.auth;

  if (!token || !lessonId) {
    console.log('❌ Token yoki lessonId yo‘q');
    return next(new Error('Not authorized'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.user_id;
    socket.lessonId = lessonId;
    socket.token = token;
    next();
  } catch (err) {
    console.log('❌ JWT verify xato:', err.message);
    return next(new Error('Not authorized'));
  }
}