import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const VariantSchema = new mongoose.Schema({
  color: { type: String },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String }
});

const ProductSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  oldPrice: Number,
  category: String,
  images: [String],
  stock: { type: Number, default: 10 },
  inStock: { type: Boolean, default: true },
  isDealOfDay: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  colors: [{ name: String, hex: String }],
  sizes: [{ name: String, dimensions: String }],
  productDetails: String,
  variants: [VariantSchema]
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const URI = "mongodb+srv://nikhilsoni0027_db_user:Nikhil%40123@cluster0.ekh4oth.mongodb.net/?appName=Cluster0";

async function seedBlankets() {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB.");

    // Avoid duplication
    await Product.deleteMany({ category: "Blankets" });
    console.log("Cleared old blankets.");

    const blanketDir = path.join(process.cwd(), 'products_images', 'blankets');
    if (!fs.existsSync(blanketDir)) {
      console.log("Blankets directory not found!");
      return;
    }
    const blanketFiles = fs.readdirSync(blanketDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    
    console.log(`Found ${blanketFiles.length} blankets. Creating products...`);

    for(let i=0; i<blanketFiles.length; i++) {
        const file = blanketFiles[i];
        const fileUrl = `/products/blankets/${file}`;
        
        await Product.create({
          title: `Cozy FLANNEL SOLID BLANKET - Design ${i+1}`,
          description: "Ultra-soft premium flannel blanket perfect for everyday comfort.",
          price: 1999,
          oldPrice: 3599,
          category: "Blankets",
          images: [fileUrl],
          stock: 50,
          inStock: true,
          colors: [],
          sizes: [
            { name: "Single", dimensions: "60 x 90 inch" },
            { name: "Double", dimensions: "90 x 100 inch" }
          ],
          productDetails: "• Premium Flannel Solid\n• Soft and Warm\n• Machine washable",
          variants: [
             { size: "Single", price: 1999, imageUrl: fileUrl },
             { size: "Double", price: 2899, imageUrl: fileUrl }
          ]
        });
    }
    
    console.log("Blankets Seeded Successfully!");
  } catch (err) {
    console.error("Error Seeding Blankets:", err);
  } finally {
    mongoose.connection.close();
  }
}

seedBlankets();
