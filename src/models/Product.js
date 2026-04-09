import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String }
});

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the product'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
  },
  oldPrice: {
    type: Number
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
  },
  images: {
    type: [String],
    required: [true, 'Please provide at least one image URL'],
  },
  stock: {
    type: Number,
    default: 10,
  },
  inStock: {
    type: Boolean,
    default: true
  },
  isDealOfDay: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  colors: [{
    name: String,
    hex: String,
    imageUrl: String
  }],
  sizes: [{
    name: String,
    dimensions: String,
    price: Number
  }],
  productDetails: {
    type: String
  },
  variants: [VariantSchema]
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
