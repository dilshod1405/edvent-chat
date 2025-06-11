import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authenticate from './middleware/auth.js';
import Message from './models/Message.js';
import routes from './routes/index.js';
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
app.use('/', routes);

// ✅ WebSocket JWT autentifikatsiyasi
io.use(authenticate);

// 🌐 Socket connection
io.on('connection', (socket) => {
  const { userId } = socket;

  if (userId) {
    socket.join(String(userId)); // Har bir userId uchun room
    console.log(`User ${userId} joined personal room`);
  }

  // ✅ Foydalanuvchi private roomga qo‘shilmoqda
  socket.on('join_private_chat', ({ room }) => {
    socket.join(room);
    console.log(`User ${userId} joined private room: ${room}`);
  });

  // BACKEND: send_message handler
  socket.on('send_message', async (data) => {
    try {
      const { content } = data;
      const { lessonId, userId, token } = socket;

      if (!lessonId || !userId || !token) {
        console.warn("❗ Missing socket info");
        return;
      }

      // 🎯 HAR DOIM support ID ni olish (ishonchli bo‘lishi uchun)
      const response = await axios.get(
        `${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const receiverId = response.data?.id;

      if (!receiverId) {
        console.warn("❗ Support topilmadi");
        return;
      }

      const newMessage = new Message({
        lessonId,
        senderId: userId,
        receiverId,
        content,
      });

      await newMessage.save();

      const messagePayload = {
        content: newMessage.content,
        senderId: userId,
        receiverId,
        timestamp: newMessage.timestamp,
        lessonId,
      };

      const privateRoom = `chat_${Math.min(userId, receiverId)}_${Math.max(userId, receiverId)}`;
      io.to(privateRoom).emit('new_message', messagePayload);

    } catch (err) {
      console.error('❌ Message error:', err);
    }
  });


  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
