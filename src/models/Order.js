import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, sparse: true },
  name: { type: String },
  email: { type: String },
  items: { type: Number },
  payload: { type: mongoose.Schema.Types.Mixed, default: [] },
  totalAmount: { type: Number, required: true },
  totalString: { type: String },
  status: { type: String, default: 'Pending' },
  color: { type: String },
  text: { type: String },
  dateString: { type: String },
  // Shipping Address (from checkout form)
  shippingDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  // PhonePe Payment Fields
  paymentStatus: { type: String, default: 'pending', enum: ['pending', 'paid', 'failed'] },
  paymentMethod: { type: String, default: 'COD', enum: ['COD', 'PhonePe'] },
  merchantTransactionId: { type: String },
  paymentTransactionId: { type: String },
  paidAt: { type: Date },
  // Shiprocket Logistics Storage
  shipmentId: { type: String },
  awbCode: { type: String },
  courierName: { type: String },
  trackingStatus: { type: String, default: 'pending_sync' },
  shiprocketOrderId: { type: String }
}, { timestamps: true });

// Index for the common sort-by-newest query to avoid in-memory sort limits
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
