import mongoose from 'mongoose';

const AbandonedCartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    customerInfo: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      district: { type: String, default: '' },
      postcode: { type: String, default: '' },
    },
    cartItems: [
      {
        id: String,
        _id: String,
        title: String,
        price: Schema => Schema.Types.Mixed,
        quantity: Number,
        color: String,
        size: String,
        images: [String],
        image: String,
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['abandoned', 'recovered', 'converted'],
      default: 'abandoned',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AbandonedCart || mongoose.model('AbandonedCart', AbandonedCartSchema);
