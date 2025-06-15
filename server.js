// server.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authenticate from './middleware/auth.js';
import routes from './routes/index.js';
import Message from './models/Message.js';
import axios from 'axios';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://edvent.uz',
      'http://www.edvent.uz',
      'https://archedu.uz'
    ],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/', routes);

// 🔐 Socket.io middleware orqali JWT ni tekshiramiz
io.use(authenticate);

// 🔌 Real-time connectionlar
io.on('connection', (socket) => {
  const { userId, lessonId, token } = socket;

  axios.get(`${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(({ data }) => {
      const supportId = data?.id;
      if (!supportId) {
        console.warn('❗ Support topilmadi');
        return socket.disconnect();
      }

      const room = `chat_l${lessonId}_u${userId}`;
      socket.join(room);
      console.log(`🔐 ${userId} joined room ${room}`);
      socket.emit('joined');

      socket.on('send_message', async ({ content }) => {
        if (!content?.trim()) return;

        const msg = new Message({
          lessonId,
          senderId: userId,
          receiverId: supportId,
          content
        });
        await msg.save();

        const payload = {
          lessonId,
          senderId: userId,
          receiverId: supportId,
          content: msg.content,
          timestamp: msg.timestamp
        };

        io.to(room).emit('new_message', payload);
      });

      socket.on('disconnect', () => {
        console.log(`💔 ${userId} left room ${room}`);
      });
    })
    .catch(err => {
      console.error('❌ Support fetch error:', err.message);
      socket.disconnect();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
