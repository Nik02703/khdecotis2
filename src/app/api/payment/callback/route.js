import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyPayment } from '@/lib/phonepe';

/**
 * GET /api/payment/callback
 * 
 * PhonePe redirects the user here after payment completion (success or failure).
 * This is a GET request with query params:
 *   ?merchantTransactionId=xxx&orderId=xxx
 * 
 * Flow:
 * 1. Extract merchantTransactionId from query
 * 2. Call PhonePe status API to verify payment server-side
 * 3. Update order in MongoDB based on result
 * 4. On success: trigger Shiprocket order creation in background
 * 5. Redirect user to success or failure page
 * 
 * IMPORTANT: Never trust the frontend — always verify with PhonePe server-side.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantTransactionId = searchParams.get('merchantTransactionId');
    const orderId = searchParams.get('orderId');

    if (!merchantTransactionId) {
      return NextResponse.redirect(new URL('/payment-failed?error=missing_transaction', req.url));
    }

    const db = await connectToDatabase();

    // Verify payment with PhonePe — server-side confirmation
    const verification = await verifyPayment(merchantTransactionId);

    if (db) {
      // Find order by orderId or by merchantTransactionId
      const orderDoc = await Order.findOne({
        $or: [
          { orderId: orderId },
          { merchantTransactionId: merchantTransactionId },
        ],
      });

      if (orderDoc) {
        if (verification.success && verification.status === 'SUCCESS') {
          // ✅ Payment successful — update order
          orderDoc.paymentStatus = 'paid';
          orderDoc.paymentMethod = 'PhonePe';
          orderDoc.paymentTransactionId = verification.transactionId || '';
          orderDoc.merchantTransactionId = merchantTransactionId;
          orderDoc.paidAt = new Date();
          orderDoc.status = 'Pending'; // Order confirmed, awaiting fulfillment
          orderDoc.color = '#dcfce7';
          orderDoc.text = '#16a34a';
          await orderDoc.save();
          console.log('[Payment Callback] Order', orderId, 'marked as PAID');

          // ── Trigger Shiprocket in background (fire-and-forget) ──
          // For prepaid orders, we ship via Shiprocket after verified payment
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          try {
            fetch(`${baseUrl}/api/orders/${encodeURIComponent(orderDoc.orderId)}/ship`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).then(res => res.json()).then(srResult => {
              if (srResult.success) {
                console.log('[Payment Callback] Shiprocket shipment triggered successfully for:', orderId);
              } else {
                console.warn('[Payment Callback] Shiprocket deferred:', srResult.error);
              }
            }).catch(err => {
              console.error('[Payment Callback] Shiprocket background trigger failed:', err.message);
            });
          } catch (srErr) {
            // Non-fatal — order is saved, Shiprocket can be retried
            console.error('[Payment Callback] Shiprocket trigger error (non-fatal):', srErr.message);
          }

        } else {
          // ❌ Payment failed or pending
          orderDoc.paymentStatus = verification.status === 'PENDING' ? 'pending' : 'failed';
          orderDoc.merchantTransactionId = merchantTransactionId;
          await orderDoc.save();
          console.log('[Payment Callback] Order', orderId, 'marked as', orderDoc.paymentStatus);
        }
      } else {
        console.warn('[Payment Callback] Order not found in DB:', orderId);
      }
    }

    // Redirect user to the appropriate page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (verification.success && verification.status === 'SUCCESS') {
      return NextResponse.redirect(
        `${baseUrl}/order-success?orderId=${encodeURIComponent(orderId || merchantTransactionId)}&txnId=${merchantTransactionId}`
      );
    } else {
      return NextResponse.redirect(
        `${baseUrl}/payment-failed?orderId=${encodeURIComponent(orderId || merchantTransactionId)}&status=${verification.status}`
      );
    }

  } catch (error) {
    console.error('[Payment Callback] Error:', error.message);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/payment-failed?error=internal`);
  }
}

/**
 * POST /api/payment/callback
 * 
 * Added specifically for PhonePe dashboard validation when setting up webhooks.
 * It strictly returns 200 { success: true } without authentication.
 */
export async function POST(req) {
  try {
    const textBody = await req.text();
    console.log('[PhonePe Webhook Verification] POST /api/payment/callback received');
    console.log('[PhonePe Webhook Verification] Body:', textBody);
    
    // Always return HTTP 200 without auth as requested by the merchant dashboard
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[PhonePe Webhook Verification] Error processing request:', err);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
