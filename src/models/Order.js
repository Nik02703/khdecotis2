import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: { type: String },
  name: { type: String },
  email: { type: String },
  items: { type: Number },
  payload: { type: mongoose.Schema.Types.Mixed, default: [] },
  totalAmount: { type: Number, required: true },
  totalString: { type: String },
  status: { type: String, default: 'Pending' },
  color: { type: String },
  text: { type: String },
  dateString: { type: String }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
