import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyPhonePePayment } from '@/lib/phonepe';

/**
 * GET /api/payment/status/[orderId]
 *
 * Frontend polls this to confirm payment result.
 * Does a server-to-server check against PhonePe V2 Order Status API.
 */
export async function GET(req, { params }) {
  const { orderId } = await params;

  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: 'DB Connection Failed' }, { status: 500 });
    }

    const decodedOrderId = decodeURIComponent(orderId);
    const orderDoc = await Order.findOne({ orderId: decodedOrderId });

    if (!orderDoc) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // If we have a merchantTransactionId, do a live check with PhonePe V2
    let phonePeState = null;
    if (orderDoc.merchantTransactionId) {
      try {
        const data = await verifyPhonePePayment(orderDoc.merchantTransactionId);
        // V2 response: { state: "COMPLETED" | "FAILED" | "PENDING", ... }
        phonePeState = data?.state || data?.data?.state || data?.code;

        // Update DB if PhonePe says something different
        if ((phonePeState === 'COMPLETED' || data?.responseCode === 'SUCCESS' || data?.code === 'PAYMENT_SUCCESS') && orderDoc.paymentStatus !== 'paid') {
          orderDoc.paymentStatus = 'paid';
          orderDoc.paymentMethod = 'PhonePe';
          orderDoc.paymentTransactionId = data?.transactionId || data?.data?.transactionId || '';
          orderDoc.paidAt = new Date();
          orderDoc.status = 'Pending';
          orderDoc.color = '#dcfce7';
          orderDoc.text = '#16a34a';
          await orderDoc.save();
        } else if ((phonePeState === 'FAILED' || data?.responseCode === 'FAILURE' || data?.code === 'PAYMENT_ERROR') && orderDoc.paymentStatus !== 'failed') {
          orderDoc.paymentStatus = 'failed';
          await orderDoc.save();
        }
      } catch (err) {
        console.warn('[Status Check] PhonePe API check failed:', err.message);
        // Fall through — return DB status
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderDoc.orderId,
      paymentStatus: orderDoc.paymentStatus,
      state: phonePeState || orderDoc.paymentStatus,
      merchantTransactionId: orderDoc.merchantTransactionId || null,
    }, { status: 200 });

  } catch (err) {
    console.error('[Status Check] Error:', err);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
