import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyProducts';

export async function GET() {
  try {
    const db = await connectToDatabase();
    
    // Graceful failover: If DB is not connected (e.g., missing URI), return dummy products!
    if (!db) {
      console.log("Serving local dummy products catalog (No database connection present).");
      return NextResponse.json(DUMMY_PRODUCTS);
    }
    
    const products = await Product.find({}).sort({ createdAt: -1 });
    
    // If the DB connects but is totally empty, seed/fallback to DUMMY_PRODUCTS
    if (products.length === 0) {
      return NextResponse.json(DUMMY_PRODUCTS);
    }
    
    return NextResponse.json(products);
    
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(DUMMY_PRODUCTS, { status: 200 }); // Never break the UI
  }
}

export async function POST(request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Cannot create product. Database strictly offline." }, { status: 503 });
    }
    
    const body = await request.json();
    const newProduct = await Product.create(body);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product via Mongoose Hook" }, { status: 500 });
  }
}
