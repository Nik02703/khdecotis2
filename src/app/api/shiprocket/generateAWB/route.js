import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { assignCourier } from '@/lib/shiprocket';

/**
 * POST /api/shiprocket/generateAWB
 * 
 * Standalone AWB generation endpoint.
 * Typically auto-called by createOrder, but can also be called
 * manually for orders stuck in "processing" without an AWB.
 * 
 * Expects: { shipmentId: string, orderId: string }
 */
export async function POST(req) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    const { shipmentId, orderId } = await req.json();

    if (!shipmentId || !orderId) {
      return NextResponse.json({ error: 'Missing shipmentId or orderId' }, { status: 400 });
    }

    console.log('[Shiprocket AWB] Generating for shipment:', shipmentId, '| Order:', orderId);

    // Use the high-level assignCourier function (handles auth, timeout, retry)
    const awbResult = await assignCourier(shipmentId);

    // Update MongoDB order with AWB details
    const orderDoc = await Order.findOne({ orderId });
    if (orderDoc) {
      orderDoc.awbCode = awbResult.awb_code || '';
      orderDoc.courierName = awbResult.courier_name || '';
      orderDoc.trackingStatus = 'assigned';
      await orderDoc.save();
      console.log('[Shiprocket AWB] Saved — AWB:', awbResult.awb_code, '| Courier:', awbResult.courier_name);
    }

    return NextResponse.json({
      success: true,
      awbCode: awbResult.awb_code,
      courierName: awbResult.courier_name,
    });

  } catch (error) {
    console.error('[Shiprocket AWB] Error:', error.message);
    // Return 200 to prevent client-side error display — this is a background operation
    return NextResponse.json({
      success: false,
      error: 'AWB generation deferred. Will retry automatically.',
    }, { status: 200 });
  }
}
