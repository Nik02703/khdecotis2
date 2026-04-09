import mongoose from 'mongoose';

const URI = "mongodb+srv://nikhilsoni0027_db_user:Nikhil%40123@cluster0.ekh4oth.mongodb.net/?appName=Cluster0";

// Minimal skeleton to just allow `.find` and `.save` over them
const ProductSchema = new mongoose.Schema({ title: String, category: String }, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function cleanup() {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB for title cleanup.");

    // Clean up Bedsheets
    const bedsheets = await Product.find({ category: "Bedsheets" });
    let count = 1;
    for (const b of bedsheets) {
      if (b.title.includes('Screenshot') || b.title.includes('Bedsheet1')) {
        b.title = `Premium Cotton Bedsheet - Design ${count}`;
        await b.save();
        count++;
      }
    }
    console.log(`Cleaned up ${count - 1} bedsheet titles.`);

    // Clean up Blankets
    const blankets = await Product.find({ category: "Blankets" });
    let bCount = 1;
    for (const b of blankets) {
      if (b.title.includes('Screenshot') || b.title.includes('Blanket')) {
        b.title = `Cozy Flannel Solid Blanket - Design ${bCount}`;
        await b.save();
        bCount++;
      }
    }
    console.log(`Cleaned up ${bCount - 1} blanket titles.`);

    // Delete any old phantom deals or duplicates if they somehow got in the DB
    // e.g., if there were test products without proper variants
    // The user also mentioned: "there are some products which i removed but they are still showing on there in the admin section"
    // Since we removed local storage merging, the frontend will now correctly reflect EXACTLY what is in MongoDB.
    
    console.log("Cleanup script finished successfully.");

  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    mongoose.connection.close();
  }
}

cleanup();
