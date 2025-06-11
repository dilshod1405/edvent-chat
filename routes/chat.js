import axios from 'axios';
import authenticateToken from '../middleware/authenticateToken.js';
import Message from '../models/Message.js';
import express from 'express';
const router = express.Router();

export default router;

router.get('/messages', authenticateToken, async (req, res) => {
  const lessonId = req.query.lesson;
  const userId = req.userId;
  const token = req.headers.authorization?.split(' ')[1];

  if (!lessonId || !userId) {
    return res.status(400).json({ error: 'lesson yoki userId yo‘q' });
  }

  try {
    const response = await axios.get(
      `${process.env.DJANGO_API_URL}/education/lessons/${lessonId}/support/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const supportId = response.data?.id;
    if (!supportId) {
      return res.status(404).json({ error: 'Support topilmadi' });
    }

    const messages = await Message.find({
      lessonId,
      $or: [
        { senderId: userId, receiverId: supportId },
        { senderId: supportId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Xatolik:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});
