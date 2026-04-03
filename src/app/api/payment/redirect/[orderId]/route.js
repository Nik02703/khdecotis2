import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyPayment } from '@/lib/phonepe';

/**
 * POST /api/payment/redirect/[orderId]
 * 
 * PhonePe redirects the user here (via POST) after payment completion.
 * Note: Since PhonePe POSTs form-data, any query params usually drop.
 * So we rely solely on the orderId provided in the dynamic URL route.
 */
export async function POST(req, { params }) {
  const { orderId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    console.log(`[PhonePe Redirect] POST received for order:`, orderId);

    const db = await connectToDatabase();
    if (!db) throw new Error("Database connection failed");

    // 1. Look up the order to get the locked-in merchantTransactionId
    const decodedOrderId = decodeURIComponent(orderId);
    const orderDoc = await Order.findOne({ orderId: decodedOrderId });

    if (!orderDoc || !orderDoc.merchantTransactionId) {
      console.error(`[PhonePe Redirect] Missing order or merchantTransactionId for:`, decodedOrderId);
      return NextResponse.redirect(`${baseUrl}/payment-failed?error=missing_transaction`, 303);
    }

    const merchantTransactionId = orderDoc.merchantTransactionId;

    // 2. Perform direct Server-to-Server Verification (highly secure)
    const verification = await verifyPayment(merchantTransactionId);

    // 3. Handle specific verification responses
    if (verification.success && verification.status === 'SUCCESS') {
      // ✅ Payment successful
      orderDoc.paymentStatus = 'paid';
      orderDoc.paymentMethod = 'PhonePe';
      orderDoc.paymentTransactionId = verification.transactionId || '';
      orderDoc.paidAt = new Date();
      orderDoc.status = 'Pending'; // Order confirmed, awaiting fulfillment
      orderDoc.color = '#dcfce7';
      orderDoc.text = '#16a34a';
      await orderDoc.save();
      console.log(`[PhonePe Redirect] Order ${orderId} marked as PAID`);

      // ── Trigger Shiprocket (DO NOT REMOVE) ──
      try {
        fetch(`${baseUrl}/api/orders/${encodeURIComponent(orderId)}/ship`, {
          method: 'POST',
        }).catch(err => console.error('[Shiprocket Trigger Failed]', err));
      } catch (e) {
        console.error('[Shiprocket Trigger Exception]', e);
      }

      return NextResponse.redirect(
        `${baseUrl}/order-success?orderId=${encodeURIComponent(orderId)}&txnId=${merchantTransactionId}`, 
        303
      );
      
    } else if (verification.status === 'PENDING') {
      // ⏳ Payment pending
      orderDoc.paymentStatus = 'pending';
      await orderDoc.save();
      console.log(`[PhonePe Redirect] Order ${orderId} is PENDING`);
      // We don't have a dedicated pending page, so direct to success with pending warning, 
      // or failure with pending message based on standard UX. We'll use failure for now.
      return NextResponse.redirect(`${baseUrl}/payment-failed?orderId=${encodeURIComponent(orderId)}&status=PENDING`, 303);
      
    } else {
      // ❌ Payment failed/declined
      orderDoc.paymentStatus = 'failed';
      await orderDoc.save();
      console.log(`[PhonePe Redirect] Order ${orderId} marked as FAILED`);
      return NextResponse.redirect(
        `${baseUrl}/payment-failed?orderId=${encodeURIComponent(orderId)}&status=${verification.status}`, 
        303
      );
    }

  } catch (error) {
    console.error(`[PhonePe Redirect] Fatal Error:`, error.message);
    return NextResponse.redirect(`${baseUrl}/payment-failed?error=internal_error`, 303);
  }
}

/**
 * GET /api/payment/redirect/[orderId]
 * 
 * PhonePe V2 Standard Checkout redirects the user here via GET.
 * Reuses the same verification logic as POST.
 */
export async function GET(req, context) {
  return POST(req, context);
}
