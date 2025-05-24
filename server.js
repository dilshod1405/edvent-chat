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
    origin: ["https://edvent.uz", "http://www.edvent.uz", "https://archedu.uz"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/', routes);

// WebSocket JWT autentifikatsiya
io.use(authenticate);

io.on('connection', (socket) => {
  const { userId } = socket;
  if (userId) {
    socket.join(String(userId)); // Har bir userId asosida "room"ga ulaymiz
    console.log(`User ${userId} joined room`);
  }

  socket.on('send_message', async (data) => {
    try {
      const { content } = data;
      const { lessonId, userId, token } = socket;

      if (!lessonId || !userId || !token) {
        console.warn("Missing required socket info: lessonId/userId/token");
        return;
      }

      // Support user ID ni Django API dan olish
      const response = await axios.get(
        `${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const receiverId = response.data?.id;
      if (!receiverId) {
        console.warn("Support teacher topilmadi");
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

      // 1. Xabarni yuboruvchining o‘ziga jo‘natamiz
      socket.emit('new_message', messagePayload);

      // 2. Xabarni support user`ga yuboramiz
      io.to(String(receiverId)).emit('new_message', messagePayload);

    } catch (err) {
      console.error('Message save error:', err.response?.data || err.message || err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
