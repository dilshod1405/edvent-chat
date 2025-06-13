import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authenticate from './middleware/auth.js';
import Message from './models/Message.js';
import chatRoutes from './routes/chat.js';
import axios from 'axios';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://edvent.uz",
      "http://www.edvent.uz",
      "https://archedu.uz"
    ],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/chat', chatRoutes);

// JWT bilan socket autentifikatsiya
io.use(authenticate);

io.on('connection', (socket) => {
  const { userId, lessonId, token } = socket;

  if (!userId || !lessonId || !token) {
    console.warn('❗ Kerakli maʼlumotlar yo‘q (userId, lessonId, token)');
    return socket.disconnect();
  }

  // Support ID ni olish
  axios.get(`${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(async response => {
    const supportId = response.data?.id;
    if (!supportId) return socket.disconnect();

    socket.supportId = supportId;

    // Join to user's room
    socket.join(String(userId));
    console.log(`✅ User ${userId} joined room`);

    const room = `chat_${Math.min(userId, supportId)}_${Math.max(userId, supportId)}`;

    socket.on('join_private_chat', ({ room: joinRoom }) => {
      if (joinRoom === room) {
        socket.join(joinRoom);
        console.log(`🟢 Joined private room: ${joinRoom}`);
      } else {
        console.warn(`❌ Unauthorized room join attempt: ${joinRoom}`);
      }
    });

    socket.on('send_message', async ({ content }) => {
      if (!content?.trim()) return;

      const message = new Message({
        lessonId,
        senderId: userId,
        receiverId: supportId,
        content,
      });

      await message.save();

      const payload = {
        lessonId,
        senderId: userId,
        receiverId: supportId,
        content: message.content,
        timestamp: message.timestamp,
      };

      io.to(room).emit('new_message', payload);
      console.log(`✉️  Message sent to room ${room}:`, content);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected:', socket.id);
    });
  }).catch(err => {
    console.error('❌ Support ID olishda xato:', err.message);
    socket.disconnect();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
