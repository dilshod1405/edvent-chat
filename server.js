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

  // 📩 Yangi xabarni qabul qilish
  socket.on('send_message', async (data) => {
    try {
      const { content, receiverId: clientReceiverId } = data;
      const { lessonId, userId, token } = socket;

      if (!lessonId || !userId || !token) {
        console.warn("❗ Missing required socket info: lessonId/userId/token");
        return;
      }

      // 🔍 Support user ID ni olish (agar receiverId frontenddan kelmagan bo‘lsa)
      let receiverId = clientReceiverId;
      if (!receiverId) {
        const response = await axios.get(
          `${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        receiverId = response.data?.id;
        if (!receiverId) {
          console.warn("❗ Support teacher topilmadi");
          return;
        }
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

      // 🔐 Har bir support-student uchun private room
      const privateRoom = `chat_${Math.min(userId, receiverId)}_${Math.max(userId, receiverId)}`;

      // Faqat shu room ichida yuboriladi
      io.to(privateRoom).emit('new_message', messagePayload);

    } catch (err) {
      console.error('❌ Message save error:', err.response?.data || err.message || err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
