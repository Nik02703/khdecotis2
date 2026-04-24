import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyRazorpayPayment } from '@/lib/razorpay';
import { createShipmentForOrder } from '@/lib/shipment';

// ═══════════════════════════════════════════════════════════════════════
// POST /api/payment/razorpay/verify
// ═══════════════════════════════════════════════════════════════════════
// Called by the frontend after the Razorpay checkout modal closes
// successfully. Verifies the payment signature and marks the order
// as PAID, then creates the Shiprocket shipment.
//
// NOTE: The Razorpay webhook (/api/payment/razorpay-webhook) also
// handles payment.captured — both paths use createShipmentForOrder()
// which has a built-in duplicate guard, so whichever fires first wins.
// ═══════════════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // ── Validate required fields ──────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay parameters' },
        { status: 400 }
      );
    }

    // ── Verify payment signature ──────────────────────────────────────
    const isValid = verifyRazorpayPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // ── Update order status in MongoDB ────────────────────────────────
    await connectDB();
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: 'paid',
        paymentTransactionId: razorpay_payment_id,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
        status: 'Processing',
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`[RazorpayVerify] ✅ Order ${order.orderId} verified & marked as PAID`);

    // ── Create Shiprocket shipment ────────────────────────────────────
    // Uses the shared helper which has a duplicate shipment guard.
    // If the webhook already created the shipment, this will skip.
    // Run asynchronously so the user gets an immediate response.
    createShipmentForOrder(order).then((result) => {
      if (result.skipped) {
        console.log(`[RazorpayVerify] Shipment already exists for ${order.orderId} — skipped`);
      } else if (result.success) {
        console.log(`[RazorpayVerify] ✅ Shipment created: ${result.shipmentId}`);
      }
    }).catch((err) => {
      console.error(`[RazorpayVerify] Shipment creation failed (non-fatal): ${err.message}`);
    });

    return NextResponse.json({ success: true, orderId: order.orderId });

  } catch (error) {
    console.error('[RazorpayVerify] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
