import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyWebhookChecksum } from '@/lib/phonepe';

/**
 * POST /api/payment/callback
 * 
 * PhonePe Server-To-Server Webhook.
 * PhonePe sends a POST request with { response: "base64string" }.
 * We verify the X-VERIFY header to authenticate the payload.
 * ALWAYS return HTTP 200 { success: true } so PhonePe doesn't endlessly retry.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const base64Response = body.response;

    if (!base64Response) {
      console.warn('[PhonePe Webhook] Missing response payload format. Returning 200 anyway.');
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const xVerifyHeader = req.headers.get('X-VERIFY') || req.headers.get('x-verify');

    // Decode early
    const decodedPayload = Buffer.from(base64Response, 'base64').toString('utf-8');
    const data = JSON.parse(decodedPayload);
    
    console.log('[PhonePe Webhook] Received payload for Merchant TXN:', data.data?.merchantTransactionId);

    // Verify Checksum (if missing, we just log a warning but still process if we trust the payload structure, 
    // though strictly we should reject. Since user asked to warn and process, we'll log it.)
    if (xVerifyHeader) {
      const isValid = verifyWebhookChecksum(base64Response, xVerifyHeader);
      if (!isValid) {
        console.warn('[PhonePe Webhook] ⚠️ INVALID CHECKSUM. Potential spoofing detected.');
      } else {
        console.log('[PhonePe Webhook] ✅ Checksum verified.');
      }
    } else {
      console.warn('[PhonePe Webhook] ⚠️ Missing X-VERIFY header.');
    }

    const merchantTransactionId = data.data?.merchantTransactionId;
    const paymentCode = data.code;
    const transactionId = data.data?.transactionId || '';

    if (!merchantTransactionId) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const db = await connectToDatabase();
    if (db) {
      const orderDoc = await Order.findOne({ merchantTransactionId });

      if (orderDoc) {
        if (paymentCode === 'PAYMENT_SUCCESS') {
          // If already paid (e.g. by redirect route), skip update logic to save DB writes
          if (orderDoc.paymentStatus !== 'paid') {
            orderDoc.paymentStatus = 'paid';
            orderDoc.paymentMethod = 'PhonePe';
            orderDoc.paymentTransactionId = transactionId;
            orderDoc.paidAt = new Date();
            orderDoc.status = 'Pending';
            orderDoc.color = '#dcfce7';
            orderDoc.text = '#16a34a';
            await orderDoc.save();
            console.log('[PhonePe Webhook] Order', orderDoc.orderId, 'marked as PAID via S2S Webhook');
          }
        } else if (paymentCode === 'PAYMENT_ERROR') {
          if (orderDoc.paymentStatus !== 'failed') {
            orderDoc.paymentStatus = 'failed';
            await orderDoc.save();
            console.log('[PhonePe Webhook] Order', orderDoc.orderId, 'marked as FAILED via S2S Webhook');
          }
        }
      }
    }

    // ALWAYS RETURN 200
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('[PhonePe Webhook] Fatal processing error:', err);
    // Still return 200
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
