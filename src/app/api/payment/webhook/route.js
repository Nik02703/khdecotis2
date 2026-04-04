import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { decodeCallbackPayload } from '@/lib/phonepe';

/**
 * POST /api/payment/webhook
 *
 * PhonePe server-to-server notification (backup mechanism).
 * Handles both V2 and V1 webhook formats.
 *
 * ALWAYS return HTTP 200 to prevent PhonePe retries.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('[Webhook] Raw body keys:', Object.keys(body));

    let merchantTransactionId = null;
    let state = null;
    let paymentCode = null;
    let phonePeTxnId = '';
    let decoded = body;

    // V1-style: { response: "<base64>" }
    if (body.response && typeof body.response === 'string') {
      decoded = decodeCallbackPayload(body.response);
      if (!decoded) {
        console.error('[Webhook] Failed to decode base64 response');
        return NextResponse.json({ success: true }, { status: 200 });
      }
    }

    // V2-style: { event: "checkout.order.completed", payload: { ... } }
    if (decoded?.event && decoded?.payload) {
      const p = decoded.payload;
      merchantTransactionId = p.merchantOrderId || p.merchantTransactionId || p.transactionId;
      state = p.state;
      paymentCode = decoded.event;
      phonePeTxnId = p.providerReferenceId || p.transactionId || '';
      if (decoded.event === 'checkout.order.completed') state = 'COMPLETED';
      if (decoded.event === 'checkout.order.failed') state = 'FAILED';
    }
    // V1-style decoded
    else if (decoded?.data?.merchantTransactionId || decoded?.code) {
      merchantTransactionId = decoded?.data?.merchantTransactionId;
      state = decoded?.data?.state;
      paymentCode = decoded?.code;
      phonePeTxnId = decoded?.data?.transactionId || '';
    }
    // Direct flat fields
    else if (decoded?.merchantOrderId || decoded?.merchantTransactionId) {
      merchantTransactionId = decoded.merchantOrderId || decoded.merchantTransactionId;
      state = decoded.state;
      phonePeTxnId = decoded.transactionId || decoded.providerReferenceId || '';
    }

    console.log('[Webhook] Transaction:', merchantTransactionId, '| State:', state, '| Event:', paymentCode);

    if (!merchantTransactionId) {
      console.error('[Webhook] No merchantTransactionId in payload');
      return NextResponse.json({ success: true }, { status: 200 });
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
        if (state === 'COMPLETED' || paymentCode === 'PAYMENT_SUCCESS' || paymentCode === 'checkout.order.completed') {
          if (orderDoc.paymentStatus !== 'paid') {
            orderDoc.paymentStatus = 'paid';
            orderDoc.paymentMethod = 'PhonePe';
            orderDoc.paymentTransactionId = phonePeTxnId;
            orderDoc.paidAt = new Date();
            orderDoc.status = 'Pending';
            orderDoc.color = '#dcfce7';
            orderDoc.text = '#16a34a';
            await orderDoc.save();
            console.log('[Webhook] Order', orderDoc.orderId, 'marked as PAID');
          }
        } else if (state === 'FAILED' || paymentCode === 'PAYMENT_ERROR' || paymentCode === 'checkout.order.failed') {
          if (orderDoc.paymentStatus !== 'failed') {
            orderDoc.paymentStatus = 'failed';
            await orderDoc.save();
            console.log('[Webhook] Order', orderDoc.orderId, 'marked as FAILED');
          }
        } else if (state === 'PENDING') {
          orderDoc.paymentStatus = 'pending';
          await orderDoc.save();
          console.log('[Webhook] Order', orderDoc.orderId, 'still PENDING');
        }
      } else {
        console.warn('[Webhook] Order not found for merchantTransactionId:', merchantTransactionId);
      }
    }

    // Always return 200
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
