import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyRazorpayPayment } from '@/lib/razorpay';
import { createShiprocketOrder } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required Razorpay parameters' }, { status: 400 });
    }

    const isValid = verifyRazorpayPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: 'paid',
        paymentTransactionId: razorpay_payment_id,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
        status: 'Processing' 
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Trigger Shiprocket order creation asynchronously
    createShiprocketOrder(order.orderId).catch(err => {
      console.error('[Shiprocket Auto-Dispatch Failed]', err.message);
    });

    return NextResponse.json({ success: true, orderId: order.orderId });
  } catch (error) {
    console.error('[Razorpay Verify] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
