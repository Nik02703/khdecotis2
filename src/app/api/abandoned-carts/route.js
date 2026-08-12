import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import AbandonedCart from '@/models/AbandonedCart';

export const dynamic = 'force-dynamic';

// GET all abandoned carts for Admin Panel
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const carts = await AbandonedCart.find(query).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({ success: true, carts });
  } catch (error) {
    console.error('[Abandoned Carts GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create or update an abandoned cart session from client
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { sessionId, customerInfo, cartItems, subtotal, totalAmount, itemCount, status } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    // If cart is empty and status is not converted/recovered, delete abandoned cart for this session
    if ((!cartItems || cartItems.length === 0) && status !== 'converted' && status !== 'recovered') {
      await AbandonedCart.findOneAndDelete({ sessionId });
      return NextResponse.json({ success: true, message: 'Empty cart session cleared' });
    }

    // Clean cartItems to prevent large Base64 images from failing MongoDB doc size limits
    const cleanItems = (cartItems || []).map(item => {
      let safeImage = item.image || item.images?.[0] || '';
      if (safeImage && safeImage.length > 50000) safeImage = '';
      return {
        id: item.id || item._id || String(Math.random()),
        title: item.title || 'Product',
        price: typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) || 0 : (item.price || 0),
        quantity: item.quantity || 1,
        color: item.color || '',
        size: item.size || '',
        image: safeImage,
      };
    });

    let updatedCustomerInfo = customerInfo || {};
    if (updatedCustomerInfo.firstName || updatedCustomerInfo.lastName) {
      updatedCustomerInfo.name = `${updatedCustomerInfo.firstName || ''} ${updatedCustomerInfo.lastName || ''}`.trim();
    }

    const cartData = {
      sessionId,
      customerInfo: updatedCustomerInfo,
      cartItems: cleanItems,
      subtotal: subtotal || 0,
      totalAmount: totalAmount || 0,
      itemCount: itemCount || cleanItems.length,
      status: status || 'abandoned',
      lastActive: new Date(),
    };

    const cart = await AbandonedCart.findOneAndUpdate(
      { sessionId },
      { $set: cartData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('[Abandoned Carts POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH update status (e.g. mark recovered/converted)
export async function PATCH(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status are required' }, { status: 400 });
    }

    const cart = await AbandonedCart.findByIdAndUpdate(
      id,
      { $set: { status, lastActive: new Date() } },
      { new: true }
    );

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('[Abandoned Carts PATCH] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE an abandoned cart record
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await AbandonedCart.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Abandoned cart deleted successfully' });
  } catch (error) {
    console.error('[Abandoned Carts DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
