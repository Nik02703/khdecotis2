import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongoose';
import Order from '@/models/Order';
import { createShipmentForOrder } from '@/lib/shipment';
import { decrementOrderStock } from '@/lib/stock';

// ═══════════════════════════════════════════════════════════════════════
// POST /api/payment/razorpay-webhook
// ═══════════════════════════════════════════════════════════════════════
// Razorpay server-to-server webhook handler.
//
// This route is called directly by Razorpay's servers when a payment
// event occurs (e.g. payment captured, payment failed).
//
// IMPORTANT:
//  - The webhook secret (RAZORPAY_WEBHOOK_SECRET) must be set in the
//    Razorpay Dashboard → Settings → Webhooks → Secret.
//  - This route must ALWAYS return 200 to prevent Razorpay retries.
//  - The raw body is needed for HMAC signature verification.
//
// Handled events:
//  • payment.captured → Mark order as PAID + create Shiprocket shipment
//  • payment.failed   → Mark order as FAILED
// ═══════════════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

/**
 * Verify the Razorpay webhook signature using HMAC SHA-256.
 * The signature is sent in the `x-razorpay-signature` header.
 *
 * @param {string} rawBody - The raw request body as a string
 * @param {string} signature - The signature from the request header
 * @returns {boolean} true if the signature is valid
 */
function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret === 'YOUR_WEBHOOK_SECRET') {
    console.error('[RazorpayWebhook] ❌ RAZORPAY_WEBHOOK_SECRET is not configured!');
    return false;
  }

  // Generate HMAC SHA-256 of the raw body using the webhook secret
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    // ── Step 1: Read raw body for signature verification ───────────────
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    console.log('[RazorpayWebhook] Received webhook call');

    // ── Step 2: Verify signature ──────────────────────────────────────
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[RazorpayWebhook] ❌ Signature verification FAILED');
      // Return 200 anyway — Razorpay recommends always returning 200
      // to prevent unnecessary retries, but log the invalid attempt
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 200 });
    }

    console.log('[RazorpayWebhook] ✅ Signature verified');

    // ── Step 3: Parse the event payload ───────────────────────────────
    const payload = JSON.parse(rawBody);
    const event = payload.event; // e.g. "payment.captured", "payment.failed"
    const paymentEntity = payload.payload?.payment?.entity || {};

    // Extract the Razorpay order ID from the payment entity
    const razorpayOrderId = paymentEntity.order_id || '';
    const razorpayPaymentId = paymentEntity.id || '';

    console.log(
      `[RazorpayWebhook] Event: ${event} | RazorpayOrderId: ${razorpayOrderId} | PaymentId: ${razorpayPaymentId}`
    );

    // ── Step 4: Connect to database ───────────────────────────────────
    await connectDB();

    // Find the order by the Razorpay order ID stored during checkout
    const orderDoc = await Order.findOne({ razorpayOrderId });

    if (!orderDoc) {
      console.warn(`[RazorpayWebhook] Order not found for razorpayOrderId: ${razorpayOrderId}`);
      return NextResponse.json({ success: true, message: 'Order not found' }, { status: 200 });
    }

    console.log(`[RazorpayWebhook] Found order: ${orderDoc.orderId} | Current status: ${orderDoc.paymentStatus}`);

    // ── Step 5: Handle the event ──────────────────────────────────────

    if (event === 'payment.captured') {
      // ── PAYMENT CAPTURED — Mark as PAID and create shipment ─────────
      // Guard: Skip if already marked as paid (idempotent)
      if (orderDoc.paymentStatus === 'paid') {
        console.log(`[RazorpayWebhook] ⏭️ Order ${orderDoc.orderId} already PAID, skipping`);
        return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 });
      }

      // Update payment status
      orderDoc.paymentStatus = 'paid';
      orderDoc.razorpayPaymentId = razorpayPaymentId;
      orderDoc.paymentTransactionId = razorpayPaymentId;
      orderDoc.paidAt = new Date();
      orderDoc.status = 'Processing';
      orderDoc.color = '#e0e7ff';
      orderDoc.text = '#4f46e5';
      await orderDoc.save();

      console.log(`[RazorpayWebhook] ✅ Order ${orderDoc.orderId} marked as PAID`);

      // Trigger stock decrement
      await decrementOrderStock(orderDoc);

      // Create Shiprocket shipment (with duplicate guard built-in)
      try {
        const shipmentResult = await createShipmentForOrder(orderDoc);
        if (shipmentResult.skipped) {
          console.log(`[RazorpayWebhook] Shipment already exists for ${orderDoc.orderId}`);
        } else {
          console.log(`[RazorpayWebhook] ✅ Shipment created: ${shipmentResult.shipmentId}`);
        }
      } catch (shipError) {
        // Shipment failure is non-fatal — order is paid and saved
        console.error(`[RazorpayWebhook] Shipment creation failed (non-fatal): ${shipError.message}`);
        // Mark for manual retry
        orderDoc.trackingStatus = 'pending_sync';
        await orderDoc.save();
      }

    } else if (event === 'payment.failed') {
      // ── PAYMENT FAILED — Mark as FAILED ─────────────────────────────
      // Guard: Don't downgrade a paid order if webhook arrives out of order
      if (orderDoc.paymentStatus === 'paid') {
        console.log(`[RazorpayWebhook] ⏭️ Order ${orderDoc.orderId} already PAID, ignoring failure event`);
        return NextResponse.json({ success: true, message: 'Already paid, ignoring' }, { status: 200 });
      }

      orderDoc.paymentStatus = 'failed';
      orderDoc.status = 'Failed';
      orderDoc.color = '#fee2e2';
      orderDoc.text = '#ef4444';
      await orderDoc.save();

      console.log(`[RazorpayWebhook] ❌ Order ${orderDoc.orderId} marked as FAILED`);

    } else {
      // Unhandled event — log and acknowledge
      console.log(`[RazorpayWebhook] Unhandled event: ${event} — acknowledged`);
    }

    // Always return 200 to prevent Razorpay retries
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[RazorpayWebhook] ❌ Unhandled error:', error.message);
    // Still return 200 to prevent infinite retries
    return NextResponse.json({ success: true, error: error.message }, { status: 200 });
  }
}
