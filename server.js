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

// JWT bilan websocket autentifikatsiyasi
io.use(authenticate);

io.on('connection', (socket) => {
  const { userId, lessonId, token } = socket;

  if (!userId || !lessonId || !token) {
    console.warn('❗ Socketga userId, lessonId yoki token biriktirilmagan');
    socket.disconnect();
    return;
  }

  // Dastlab supportId ni olish va socket ga saqlash
  axios.get(`${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(response => {
    const supportId = response.data?.id;

    if (!supportId) {
      console.warn(`❗ Lesson ${lessonId} uchun support topilmadi`);
      socket.disconnect();
      return;
    }

    socket.supportId = supportId;

    // Har bir user o'zining shaxsiy roomiga qo'shiladi
    socket.join(String(userId));
    console.log(`User ${userId} joined personal room`);

    // Foydalanuvchi private chat xonasiga qo‘shilish uchun event
    socket.on('join_private_chat', ({ room }) => {
      const expectedRoom = `chat_${Math.min(socket.userId, socket.supportId)}_${Math.max(socket.userId, socket.supportId)}`;

      if (room !== expectedRoom) {
        console.warn(`❌ User ${socket.userId} tried to join unauthorized room: ${room}`);
        return;
      }

      socket.join(room);
      console.log(`✅ User ${socket.userId} joined private room: ${room}`);
    });

    // Xabar yuborish
    socket.on('send_message', async (data) => {
      try {
        const { content } = data;

        if (!content || !content.trim()) {
          console.warn('❗ Bo‘sh xabar yuborilmoqda');
          return;
        }

        const newMessage = new Message({
          lessonId,
          senderId: userId,
          receiverId: supportId,
          content,
        });

        await newMessage.save();

        const messagePayload = {
          content: newMessage.content,
          senderId: userId,
          receiverId: supportId,
          timestamp: newMessage.timestamp,
          lessonId,
        };

        // Support-student uchun private room
        const privateRoom = `chat_${Math.min(userId, supportId)}_${Math.max(userId, supportId)}`;

        io.to(privateRoom).emit('new_message', messagePayload);
      } catch (err) {
        console.error('❌ Message save error:', err.response?.data || err.message || err);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });

  }).catch(err => {
    console.error('❌ Support ID olishda xato:', err.response?.data || err.message || err);
    socket.disconnect();
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
