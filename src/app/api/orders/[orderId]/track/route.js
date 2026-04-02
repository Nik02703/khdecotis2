import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { shiprocketFetch } from '@/lib/shiprocket';

/**
 * GET /api/orders/[orderId]/track
 * 
 * Fetches real-time tracking info for an order.
 * Uses the stored awbCode to query Shiprocket's tracking API.
 * Updates the local DB with the latest status for caching.
 */
export async function GET(req, { params }) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    const { orderId } = await params;

    // Find order in MongoDB
    const orderDoc = await Order.findOne({ orderId });
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
        message: 'Shipment is being arranged. AWB not yet assigned.',
      });
    }

    // Query Shiprocket tracking API with 401 auto-retry
    const { response, data } = await shiprocketFetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${orderDoc.awbCode}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.warn(`[Tracking] API error for AWB ${orderDoc.awbCode}:`, JSON.stringify(data));
      // Return cached data on API failure
      return NextResponse.json({
        success: true,
        courierName: orderDoc.courierName || 'Carrier Assigned',
        awbCode: orderDoc.awbCode,
        trackingStatus: orderDoc.trackingStatus || 'processing',
        expectedDelivery: null,
        message: 'Live tracking temporarily unavailable. Showing cached status.',
      });
    }

    // Parse Shiprocket tracking response
    const trackingData = data.tracking_data || {};

    // Handle Shiprocket-level errors (common if shipment was just created)
    if (trackingData.error) {
      return NextResponse.json({
        success: true,
        courierName: orderDoc.courierName || 'Carrier Assigned',
        awbCode: orderDoc.awbCode,
        trackingStatus: orderDoc.trackingStatus || 'Manifesting',
        expectedDelivery: null,
        message: 'Shipment is being processed by the courier.',
      });
    }

    // Extract live tracking details
    const shipmentTrack = Array.isArray(trackingData.shipment_track)
      ? trackingData.shipment_track[0]
      : trackingData.shipment_track;

    const liveStatus = shipmentTrack?.current_status || orderDoc.trackingStatus;
    const expectedDelivery = shipmentTrack?.expected_date || null;
    const shipmentActivities = trackingData.shipment_track_activities || [];

    // Sync latest status back to MongoDB (fire-and-forget)
    if (liveStatus && liveStatus !== orderDoc.trackingStatus) {
      orderDoc.trackingStatus = liveStatus;
      orderDoc.save().catch(err =>
        console.warn('[Tracking] Failed to sync status to DB:', err.message)
      );
    }

    return NextResponse.json({
      success: true,
      courierName: orderDoc.courierName || 'Carrier Assigned',
      awbCode: orderDoc.awbCode,
      trackingStatus: liveStatus,
      expectedDelivery,
      activities: shipmentActivities.slice(0, 10), // Last 10 tracking events
    });

  } catch (error) {
    console.error('[Tracking] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Tracking temporarily unavailable.',
    }, { status: 200 });
  }
}
