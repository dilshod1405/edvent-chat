import jwt from 'jsonwebtoken';

const authenticate = (socket, next) => {
  const { token, lessonId } = socket.handshake.auth;

  if (!token) {
    return next(new Error('Token yo‘q'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user_id;
    socket.lessonId = lessonId;
    socket.token = token;
    next();
  } catch (err) {
    return next(new Error('Token noto‘g‘ri'));
  }
};

export default authenticate;
