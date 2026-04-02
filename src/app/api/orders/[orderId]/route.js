import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';

/**
 * GET /api/orders/[orderId]
 * 
 * Fetch a single order by its orderId (e.g., #KHD-1234).
 * Used by the order-success and payment-failed pages.
 */
export async function GET(req, { params }) {
  try {
    const { orderId } = await params;
    const decodedId = decodeURIComponent(orderId);

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const order = await Order.findOne({ orderId: decodedId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('[Order GET] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/[orderId]
 * 
 * Update specific fields on an order (e.g., convert to COD after failed payment).
 * Only allows updating safe fields: paymentMethod, paymentStatus, status, color, text.
 */
export async function PATCH(req, { params }) {
  try {
    const { orderId } = await params;
    const decodedId = decodeURIComponent(orderId);
    const body = await req.json();

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const order = await Order.findOne({ orderId: decodedId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow updating safe fields
    const allowedFields = ['paymentMethod', 'paymentStatus', 'status', 'color', 'text'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        order[field] = body[field];
      }
    }

    await order.save();

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('[Order PATCH] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
