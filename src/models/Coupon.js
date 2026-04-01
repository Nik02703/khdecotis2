import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, required: true, default: 'percent' },
  value: { type: Number, required: true },
  maxUses: { type: Number, default: 1000 },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
