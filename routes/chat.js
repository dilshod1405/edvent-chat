// routes/chat.routes.js
import express from 'express';
import axios from 'axios';
import authenticateToken from '../middleware/authenticateToken.js';
import Message from '../models/Message.js';

const router = express.Router();

/**
 * GET /chat/messages?lesson=LESSON_ID
 * – Faqat shu userId va supportId o‘rtasidagi xabarlar qaytariladi.
 */
router.get('/messages', authenticateToken, async (req, res) => {
  const lessonId = req.query.lesson;
  const userId   = req.userId;
  const token    = req.headers.authorization?.split(' ')[1];

  if (!lessonId) {
    return res.status(400).json({ error: 'lessonId yo‘q' });
  }

  try {
    // 1) Django API’dan supportId olish
    const { data } = await axios.get(
      `${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const supportId = data?.id;
    if (!supportId) {
      return res.status(404).json({ error: 'Support topilmadi' });
    }

    // 2) Faqat shu juftlik xabarlarini qaytarish
    const messages = await Message.find({
      lessonId,
      $or: [
        { senderId: userId,   receiverId: supportId },
        { senderId: supportId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });

    return res.json(messages);
  } catch (err) {
    console.error('❌ /chat/messages error:', err.message);
    return res.status(500).json({ error: 'Server xatosi' });
  }
});

export default router;
