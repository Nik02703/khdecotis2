import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import { getDisplayPrice, getOldPrice } from '@/lib/priceUtils';

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const products = await Product.find({});
    let updatedCount = 0;
    const log = [];

    for (const p of products) {
      const pObj = p.toObject();
      const newPrice = getDisplayPrice(pObj);
      const newOldPrice = getOldPrice(pObj, newPrice);

      let needsUpdate = false;
      const updateData = {};

      if (p.price !== newPrice && newPrice > 0) {
        updateData.price = newPrice;
        needsUpdate = true;
      }

      if (p.oldPrice !== newOldPrice && newOldPrice > 0) {
        updateData.oldPrice = newOldPrice;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Product.updateOne({ _id: p._id }, { $set: updateData });
        updatedCount++;
        log.push({
          title: p.title,
          productNumber: p.productNumber,
          old_price: p.price,
          new_price: newPrice,
          old_oldPrice: p.oldPrice,
          new_oldPrice: newOldPrice
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${updatedCount} products in MongoDB database!`,
      updatedCount,
      log
    });
  } catch (err) {
    console.error('Error syncing product prices:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
