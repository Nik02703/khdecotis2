import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { trackShipment } from '@/lib/shiprocket';

/**
 * GET /api/orders/[orderId]/track
 * 
 * Fetches real-time tracking info for an order.
 * Uses the stored awbCode to query Shiprocket's tracking API
 * via the high-level trackShipment() function.
 * 
 * Returns structured tracking data:
 *  - awbCode, courierName, trackingStatus
 *  - expectedDelivery date
 *  - activities[] — array of { date, activity, location }
 * 
 * Updates the local DB with the latest status for caching.
 */
export async function GET(req, { params }) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    const { orderId } = await params;
    const decodedId = decodeURIComponent(orderId);

    // Find order in MongoDB
    const orderDoc = await Order.findOne({ orderId: decodedId });
    if (!orderDoc) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // If no AWB assigned yet, return current DB state
    if (!orderDoc.awbCode) {
      return NextResponse.json({
        success: true,
        courierName: orderDoc.courierName || null,
        awbCode: null,
        trackingStatus: orderDoc.trackingStatus || 'pending_sync',
        expectedDelivery: null,
        activities: [],
        message: 'Shipment is being arranged. AWB not yet assigned.',
      });
    }

    // Use the high-level trackShipment function (handles auth, timeout, retry)
    const tracking = await trackShipment(orderDoc.awbCode);

    // Sync latest status back to MongoDB (fire-and-forget)
    if (tracking.current_status && tracking.current_status !== orderDoc.trackingStatus) {
      orderDoc.trackingStatus = tracking.current_status;
      orderDoc.save().catch(err =>
        console.warn('[Tracking] Failed to sync status to DB:', err.message)
      );
    }

    return NextResponse.json({
      success: true,
      courierName: orderDoc.courierName || 'Carrier Assigned',
      awbCode: orderDoc.awbCode,
      trackingStatus: tracking.current_status,
      expectedDelivery: tracking.expected_delivery_date,
      activities: tracking.events || [],
      message: tracking.message || null,
    });

  } catch (error) {
    console.error('[Tracking] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Tracking temporarily unavailable.',
    }, { status: 200 });
  }
}
