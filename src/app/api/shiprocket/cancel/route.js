import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { cancelShiprocketOrder } from '@/lib/shiprocket';

/**
 * POST /api/shiprocket/cancel
 * 
 * Cancel one or more orders on Shiprocket and update their status in MongoDB.
 * 
 * Expects: { orderIds: string[] }  — array of our internal orderId values (e.g. "#KHD-1234")
 * 
 * Flow:
 *  1. Find orders in MongoDB with shiprocketOrderId
 *  2. Call Shiprocket cancel API with shiprocketOrderIds
 *  3. Update order status to 'Cancelled' in MongoDB
 */
export async function POST(req) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    const { orderIds } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds array is required.' }, { status: 400 });
    }

    console.log('[Shiprocket Cancel] Cancelling orders:', orderIds);

    // Collect Shiprocket order IDs from MongoDB
    const orderDocs = await Order.find({ orderId: { $in: orderIds } });

    if (orderDocs.length === 0) {
      return NextResponse.json({ error: 'No matching orders found in database.' }, { status: 404 });
    }

    // Extract Shiprocket order IDs (numeric IDs from Shiprocket)
    const shiprocketIds = orderDocs
      .map(doc => doc.shiprocketOrderId)
      .filter(Boolean)
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));

    // Call Shiprocket cancel API if we have valid IDs
    let cancelResult = null;
    if (shiprocketIds.length > 0) {
      try {
        cancelResult = await cancelShiprocketOrder(shiprocketIds);
      } catch (srError) {
        console.error('[Shiprocket Cancel] API error (non-fatal):', srError.message);
        // Continue with local DB update even if Shiprocket cancel fails
      }
    } else {
      console.warn('[Shiprocket Cancel] No Shiprocket order IDs found — updating local status only.');
    }

    // Update all matching orders to Cancelled in MongoDB
    const updateResult = await Order.updateMany(
      { orderId: { $in: orderIds } },
      {
        status: 'Cancelled',
        trackingStatus: 'cancelled',
        color: '#fee2e2',
        text: '#ef4444',
      }
    );

    console.log('[Shiprocket Cancel] ✅ Updated', updateResult.modifiedCount, 'orders to Cancelled.');

    return NextResponse.json({
      success: true,
      cancelled: updateResult.modifiedCount,
      shiprocketResult: cancelResult,
    });

  } catch (error) {
    console.error('[Shiprocket Cancel] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
