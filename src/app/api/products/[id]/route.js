import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams || {};
    const cleanId = decodeURIComponent(id || '').trim();
    let product = null;

    if (cleanId.length === 24 && /^[0-9a-fA-F]{24}$/.test(cleanId)) {
      product = await Product.findById(cleanId);
    }

    if (!product) {
      product = await Product.findOne({ slug: cleanId });
    }

    if (!product) {
      const words = cleanId.split('-').filter(Boolean);
      if (words.length > 0) {
        const regexPattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        product = await Product.findOne({ title: { $regex: new RegExp(`^.*${regexPattern}.*$`, 'i') } });
      }
    }

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams || {};
    const body = await request.json();
    
    if (!body.productNumber) {
      const existing = await Product.findById(id);
      if (existing && !existing.productNumber) {
        let isUnique = false;
        let code = '';
        while (!isUnique) {
          const rand = Math.floor(10000 + Math.random() * 90000);
          code = `KHD-${rand}`;
          const dup = await Product.findOne({ productNumber: code });
          if (!dup) isUnique = true;
        }
        body.productNumber = code;
      }
    }

    const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams || {};
    const product = await Product.findByIdAndDelete(id);
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
