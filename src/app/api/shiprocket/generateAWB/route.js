import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { shiprocketFetch } from '@/lib/shiprocket';

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

    const { response, data } = await shiprocketFetch(
      'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
      {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: shipmentId,
          courier_id: '', // Empty = Shiprocket auto-assigns best courier
        }),
      }
    );

    if (!response.ok) {
      console.error('[Shiprocket AWB] API error:', JSON.stringify(data));
      throw new Error(data.message || `AWB API returned status ${response.status}`);
    }

    // Parse AWB response
    if (data.response && data.response.data) {
      const awbCode = data.response.data.awb_code;
      const courierName = data.response.data.courier_name;

      // Update MongoDB order with AWB details
      const orderDoc = await Order.findOne({ orderId });
      if (orderDoc) {
        orderDoc.awbCode = awbCode || '';
        orderDoc.courierName = courierName || '';
        orderDoc.trackingStatus = 'assigned';
        await orderDoc.save();
        console.log('[Shiprocket AWB] Saved — AWB:', awbCode, '| Courier:', courierName);
      }

      return NextResponse.json({ success: true, awbCode, courierName });
    } else {
      throw new Error('Shiprocket returned unexpected AWB response structure.');
    }

  } catch (error) {
    console.error('[Shiprocket AWB] Error:', error.message);
    // Return 200 to prevent client-side error display — this is a background operation
    return NextResponse.json({
      success: false,
      error: 'AWB generation deferred. Will retry automatically.',
    }, { status: 200 });
  }
}
