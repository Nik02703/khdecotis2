import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { createShipmentForOrder } from '@/lib/shipment';

// ═══════════════════════════════════════════════════════════════════════
// POST /api/shiprocket/createOrder
// ═══════════════════════════════════════════════════════════════════════
// Called in the background after an order is saved to MongoDB.
// For COD orders: triggered immediately from OrderContext.
// For Prepaid orders: triggered from the Razorpay verify/webhook routes.
//
// Uses the shared createShipmentForOrder() helper which:
//   1. Checks for duplicate shipments (prevents double-shipping)
//   2. Creates the Shiprocket order
//   3. Assigns courier + generates AWB
//   4. Saves tracking info back to the order document
//
// If Shiprocket fails, the order stays in MongoDB with
// trackingStatus: "pending_sync" — never blocking the customer.
// ═══════════════════════════════════════════════════════════════════════

export async function POST(req) {
  let orderDoc = null;

  try {
    // ── Connect to the database ───────────────────────────────────────
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    // ── Find the order in MongoDB ─────────────────────────────────────
    const orderData = await req.json();
    const orderId = orderData.id || orderData.orderId;

    orderDoc = await Order.findOne({ orderId });
    if (!orderDoc) {
      console.warn('[Shiprocket] Order not found in DB:', orderId);
      return NextResponse.json(
        { success: false, error: 'Order not found in database.' },
        { status: 404 }
      );
    }

    // ── Merge any shipping details from the request ───────────────────
    // The request may include fresh shipping details from the checkout form
    if (orderData.shippingDetails && Object.keys(orderData.shippingDetails).length > 0) {
      orderDoc.shippingDetails = {
        ...orderDoc.shippingDetails,
        ...orderData.shippingDetails,
      };
      await orderDoc.save();
    }

    // ── Create shipment using shared helper ───────────────────────────
    // The helper has a built-in duplicate guard — if shipmentId already
    // exists on the order, it skips and returns { skipped: true }
    const result = await createShipmentForOrder(orderDoc);

    if (result.skipped) {
      console.log(`[Shiprocket] Shipment already exists for ${orderId} — skipped`);
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Shipment already exists, no duplicate created.',
      });
    }

    return NextResponse.json({ success: true, shipment: result });

  } catch (error) {
    console.error('[Shiprocket] Create Order Error:', error.message);

    // Mark order for manual retry if creation failed
    if (orderDoc) {
      try {
        orderDoc.trackingStatus = 'pending_sync';
        await orderDoc.save();
      } catch (dbErr) {
        console.error('[Shiprocket] Failed to mark order as pending_sync:', dbErr.message);
      }
    }

    // Return 200 so the client doesn't see an error — customer checkout is confirmed
    return NextResponse.json(
      { success: false, error: 'Shiprocket sync deferred. Order is saved locally.' },
      { status: 200 }
    );
  }
}
