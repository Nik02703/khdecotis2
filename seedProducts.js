import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load model
// Since we are running outside nextjs standard we define schema inline to execute directly
const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
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

const DUAL_COLORS = {
  "Blue Fog": "linear-gradient(135deg, #a3b5c7 50%, #ffffff 50%)",
  "Bubble Gum": "linear-gradient(135deg, #ffb6c1 50%, #fefefe 50%)",
  "French Roast": "linear-gradient(135deg, #5c4033 50%, #d2b48c 50%)",
  "Ginger Spice": "linear-gradient(135deg, #d2691e 50%, #f5deb3 50%)",
  "Hot Chocolate": "linear-gradient(135deg, #6b442a 50%, #deb887 50%)",
  "Rose Dust": "linear-gradient(135deg, #dcaab1 50%, #fff0f5 50%)",
  "Royal Opera": "linear-gradient(135deg, #483d8b 50%, #e6e6fa 50%)",
  "Urban night": "linear-gradient(135deg, #2f4f4f 50%, #696969 50%)"
};

async function seed() {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB.");

    // Seeds Comforters
    const comforterDir = path.join(process.cwd(), 'products_images', 'comforter');
    const files = fs.readdirSync(comforterDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    
    let comforterColors = [];
    let comforterVariants = [];
    let comforterImages = [];
    
    files.forEach(file => {
      // file looks like: comforter(Blue Fog).png
      const match = file.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const colorName = match[1];
        // For simplicity, we just use the raw file path. In production you'd upload to Cloudinary.
        // Assuming we serve them from public or relative
        // We copied them to public/products
        const fileUrl = `/products/comforter/${file}`;
        comforterImages.push(fileUrl);
        
        comforterColors.push({
          name: colorName,
          hex: DUAL_COLORS[colorName] || '#cccccc'
        });

        // Add 2 sizes Variants for each color
        comforterVariants.push({
          color: colorName,
          size: "Single",
          price: 2499,
          imageUrl: fileUrl
        });
        comforterVariants.push({
          color: colorName,
          size: "Double",
          price: 3499,
          imageUrl: fileUrl
        });
      }
    });

    const comforterData = {
      title: "Everyday Reversible Comforter Set",
      description: "Experience absolute comfort with our premium everyday comforters. Designed with a dual-color reversible fabric allowing versatile room decor.",
      price: 2499,
      oldPrice: 4999,
      category: "Comforter",
      images: comforterImages,
      stock: 50,
      inStock: true,
      colors: comforterColors,
      sizes: [
        { name: "Single", dimensions: "150 x 228 cm" },
        { name: "Double", dimensions: "220 x 240 cm" }
      ],
      productDetails: "• 100% Breathable Cotton Shell\n• Microfiber filling\n• Reversible Dual-Tone Design\n• Machine washable",
      variants: comforterVariants
    };

    console.log("Creating comforter product...");
    await Product.create(comforterData);

    // Bedhseets Logic - we will create a generic collection out of them
    const bedsheetDir = path.join(process.cwd(), 'products_images', 'bedsheets');
    const bsFiles = fs.readdirSync(bedsheetDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    
    const bedsheetData = {
      title: "Premium Prints Bedsheet Collection",
      description: "Luxurious pure cotton printed bedsheets that elevate your bedroom aesthetic instantly.",
      price: 1899,
      oldPrice: 3299,
      category: "Bedsheets",
      images: bsFiles.slice(0, 10).map(f => `/products/bedsheets/${f}`),
      stock: 100,
      inStock: true,
      colors: [], // Omitted for bedsheets as variations are just prints based on images for now, or you can add them.
      sizes: [
        { name: "Queen", dimensions: "90 x 100 inch" },
        { name: "King", dimensions: "108 x 108 inch" }
      ],
      productDetails: "• 300 Thread Count Cotton\n• Fast colors\n• Includes 2 Pillow covers",
      variants: bsFiles.slice(0,10).map((f, i) => ({
        color: `Print ${i+1}`,
        size: "Queen",
        price: 1899,
        imageUrl: `/products/bedsheets/${f}`
      }))
    };
    
    // Add print colors dynamically to bedsheet
    bedsheetData.colors = bedsheetData.variants.map(v => ({ name: v.color, hex: '#eee' }));

    console.log("Creating bedsheets master product...");
    await Product.create(bedsheetData);

    console.log("Products Seeded Successfully!");
  } catch (err) {
    console.error("Error Seeding:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
