import express from 'express';
import Message from '../models/Message.js';
import authenticateToken from '../middleware/auth_http.js';

const router = express.Router();

router.get('/messages', authenticateToken, async (req, res) => {
  const lessonId = req.query.lesson;

  if (!lessonId) {
    return res.status(400).json({ error: 'lesson parametri kerak' });
  }

  try {
    const messages = await Message.find({ lessonId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Xabarlarni olishda xato:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

export default router;