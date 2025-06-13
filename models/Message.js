// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  lessonId:   { type: String, required: true },
  senderId:   { type: String, required: true },
  receiverId: { type: String, required: true },
  content:    { type: String, required: true },
  timestamp:  { type: Date,   default: Date.now }
});

export default mongoose.model('Message', messageSchema);
