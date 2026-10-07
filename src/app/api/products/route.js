import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyProducts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await connectToDatabase();
    
    // Graceful failover: If DB is not connected (e.g., missing URI), return dummy products!
    if (!db) {
      if (process.env.NODE_ENV === 'production') {
        console.error("[api/products] NO DATABASE CONNECTION in Production. Check your MONGODB_URI environment variable.");
      }
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

    // Sanitize fields before creating product
    if (!body.productNumber || !body.productNumber.toString().trim()) {
      delete body.productNumber;
    }
    if (!body.description || !body.description.toString().trim()) {
      body.description = body.title ? `Premium ${body.title}` : 'Premium home decor item';
    }
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      body.images = ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'];
    }

    const newProduct = await Product.create(body);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("[api/products POST] Failed to create product:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
