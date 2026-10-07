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
    default: '',
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
    default: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'],
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
  responsibleDesign: {
    type: String
  },
  care: {
    type: String
  },
  barcode: {
    type: String
  },
  productNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  slug: {
    type: String,
    index: true
  },
  variants: [VariantSchema]
}, { timestamps: true });

ProductSchema.pre('save', async function() {
  if (this.title && !this.slug) {
    const generatedSlug = this.title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.slug = generatedSlug || `prod-${Date.now()}`;
  }

  if (!this.productNumber || !this.productNumber.trim()) {
    let isUnique = false;
    let code = '';
    while (!isUnique) {
      const rand = Math.floor(10000 + Math.random() * 90000);
      code = `KHD-${rand}`;
      const existing = await this.constructor.findOne({ productNumber: code });
      if (!existing) {
        isUnique = true;
      }
    }
    this.productNumber = code;
  }
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
