import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  lessonId: String,
  senderId: String,
  receiverId: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);