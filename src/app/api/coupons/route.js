import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Coupon from '@/models/Coupon';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    if (code) {
      // Validate specific coupon
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });
      }
      return NextResponse.json(coupon, { status: 200 });
    } else {
      // Fetch all coupons for admin
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      return NextResponse.json(coupons, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }
    
    const body = await req.json();
    
    const newCoupon = await Coupon.create({
      code: body.code,
      type: body.type || 'percent',
      value: body.value,
      maxUses: body.maxUses || 1000,
      active: body.active !== undefined ? body.active : true
    });
    
    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error) {
    // If someone creates a coupon that already exists
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Coupon code already exists in global database.' }, { status: 400 });
    }
    console.error("Coupon DB Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
