import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';

/**
 * GET /api/payment/status/[orderId]
 * 
 * Fetches the current payment status of an order from the database.
 */
export async function GET(req, { params }) {
  const { orderId } = await params;
  
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: "DB Connection Failed" }, { status: 500 });
    }

    const orderDoc = await Order.findOne({ orderId });

    if (!orderDoc) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      orderId: orderDoc.orderId,
      paymentStatus: orderDoc.paymentStatus,
      merchantTransactionId: orderDoc.merchantTransactionId || null
    }, { status: 200 });

  } catch (err) {
    console.error('[API Status Check] Error:', err);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
