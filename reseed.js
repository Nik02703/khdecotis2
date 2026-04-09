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

async function seed() {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB.");

    // Delete existing bedsheets created by old seed (optional, but good to clean up)
    await Product.deleteMany({ category: "Bedsheets" });
    console.log("Cleared old beds.");

    const bedsheetDir = path.join(process.cwd(), 'products_images', 'bedsheets');
    const bsFiles = fs.readdirSync(bedsheetDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    
    console.log(`Found ${bsFiles.length} bedsheets. Creating separate products...`);

    for(let i=0; i<bsFiles.length; i++) {
        const file = bsFiles[i];
        const matchName = file.replace('.png','').replace('.jpg','');
        const fileUrl = `/products/bedsheets/${file}`;
        
        await Product.create({
          title: `Premium Cotton Bedsheet - ${matchName.replace('Bedsheet','Design ')}`,
          description: "Luxurious pure cotton printed bedsheets that elevate your bedroom aesthetic instantly.",
          price: 1899,
          oldPrice: 3299,
          category: "Bedsheets",
          images: [fileUrl],
          stock: 100,
          inStock: true,
          colors: [],
          sizes: [
            { name: "Queen", dimensions: "90 x 100 inch" },
            { name: "King", dimensions: "108 x 108 inch" }
          ],
          productDetails: "• 300 Thread Count Cotton\n• Fast colors\n• Includes 2 Pillow covers",
          variants: [
             { size: "Queen", price: 1899, imageUrl: fileUrl },
             { size: "King", price: 2399, imageUrl: fileUrl }
          ]
        });
    }
    
    console.log("Products Seeded Successfully!");
  } catch (err) {
    console.error("Error Seeding:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
