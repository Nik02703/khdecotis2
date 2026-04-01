import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  customId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  text: { type: String, required: true },
  status: { type: String, default: 'unread' }
}, {
  timestamps: true
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
