import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyWebhookChecksum } from '@/lib/phonepe';

/**
 * POST /api/payment/webhook
 * 
 * PhonePe server-to-server notification (backup mechanism).
 * If the user closes their browser before the callback redirect,
 * this webhook ensures the order payment status is still updated.
 * 
 * PhonePe sends:
 *   Headers: { "X-VERIFY": "<checksum>" }
 *   Body: { "response": "<base64-encoded-response>" }
 * 
 * Flow:
 * 1. Extract the base64 response and X-VERIFY header
 * 2. Verify checksum — REJECT if invalid (mandatory security check)
 * 3. Decode the response to get transaction details
 * 4. Update order payment status in MongoDB
 * 5. Return 200 OK to PhonePe
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const base64Response = body.response;

    if (!base64Response) {
      console.error('[Webhook] Missing response payload');
      return NextResponse.json({ error: 'Missing response payload' }, { status: 400 });
    }

    // Get the X-VERIFY header for checksum validation
    const xVerifyHeader = req.headers.get('X-VERIFY') || req.headers.get('x-verify');

    if (!xVerifyHeader) {
      console.error('[Webhook] Missing X-VERIFY header — rejecting');
      return NextResponse.json({ error: 'Missing X-VERIFY header' }, { status: 401 });
    }

    // MANDATORY: Verify checksum to ensure this is genuinely from PhonePe
    const isValid = verifyWebhookChecksum(base64Response, xVerifyHeader);
    if (!isValid) {
      console.error('[Webhook] INVALID checksum — possible spoofed request. Rejecting.');
      return NextResponse.json({ error: 'Invalid checksum' }, { status: 401 });
    }

    // Decode the base64 response
    const decodedResponse = JSON.parse(
      Buffer.from(base64Response, 'base64').toString('utf-8')
    );

    console.log('[Webhook] Decoded response:', JSON.stringify(decodedResponse));

    const merchantTransactionId = decodedResponse.data?.merchantTransactionId;
    const paymentCode = decodedResponse.code;
    const transactionId = decodedResponse.data?.transactionId || '';

    if (!merchantTransactionId) {
      console.error('[Webhook] No merchantTransactionId in response');
      return NextResponse.json({ success: true }); // Return 200 anyway to prevent retries
    }

    // Update the order in MongoDB
    const db = await connectToDatabase();
    if (db) {
      const orderDoc = await Order.findOne({
        $or: [
          { merchantTransactionId: merchantTransactionId },
          { orderId: `#${merchantTransactionId}` },
        ],
      });

      if (orderDoc) {
        if (paymentCode === 'PAYMENT_SUCCESS') {
          orderDoc.paymentStatus = 'paid';
          orderDoc.paymentMethod = 'PhonePe';
          orderDoc.paymentTransactionId = transactionId;
          orderDoc.paidAt = new Date();
          orderDoc.status = 'Pending'; // Confirmed, awaiting fulfillment
          orderDoc.color = '#dcfce7';
          orderDoc.text = '#16a34a';
          console.log('[Webhook] Order', orderDoc.orderId, 'marked as PAID via webhook');
        } else if (paymentCode === 'PAYMENT_PENDING') {
          orderDoc.paymentStatus = 'pending';
          console.log('[Webhook] Order', orderDoc.orderId, 'still PENDING');
        } else {
          orderDoc.paymentStatus = 'failed';
          console.log('[Webhook] Order', orderDoc.orderId, 'marked as FAILED');
        }

        await orderDoc.save();
      } else {
        console.warn('[Webhook] Order not found for merchantTransactionId:', merchantTransactionId);
      }
    }

    // Always return 200 to PhonePe to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    // Still return 200 to prevent PhonePe from retrying endlessly
    return NextResponse.json({ success: true });
  }
}
