import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Order from '@/models/Order';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(request) {
  try {
    const { orderId, amount, userPhone, userEmail, userName } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let numericAmount = amount;
    if (typeof amount === 'string') {
      numericAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 });
    }

    const result = await createRazorpayOrder({
      amount: numericAmount,
      orderId,
    });

    if (!result.success || !result.razorpayOrderId) {
      return NextResponse.json(
        { error: `Razorpay API Error: ${result.error || 'No order ID returned'}` },
        { status: 502 }
      );
    }

    await connectDB();
    await Order.findOneAndUpdate(
      { orderId },
      { 
        paymentMethod: 'Razorpay',
        razorpayOrderId: result.razorpayOrderId,
      }
    );

    return NextResponse.json({
      success: true,
      razorpayOrderId: result.razorpayOrderId,
      amount: result.amount,
      currency: result.currency
    });

  } catch (error) {
    console.error('[Razorpay Create] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
