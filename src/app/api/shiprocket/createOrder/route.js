import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { shiprocketFetch } from '@/lib/shiprocket';

/**
 * POST /api/shiprocket/createOrder
 * 
 * Called in the background after an order is saved to MongoDB.
 * Maps our order fields to Shiprocket's required format, creates
 * the order on Shiprocket, then auto-chains AWB generation.
 * 
 * If Shiprocket fails at any point, the order stays in MongoDB
 * with trackingStatus: "pending_sync" — never blocking the customer.
 */
export async function POST(req) {
  let orderDoc = null;

  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    const orderData = await req.json();
    const orderId = orderData.id || orderData.orderId;

    // Find the order in MongoDB (it should already be saved by OrderContext)
    orderDoc = await Order.findOne({ orderId });
    if (!orderDoc) {
      console.warn('[Shiprocket] Order not found in DB:', orderId);
      return NextResponse.json({ success: false, error: 'Order not found in database.' }, { status: 404 });
    }

    // Merge shipping details: prefer request payload, fallback to DB document
    const shippingDetails = orderData.shippingDetails || orderDoc.shippingDetails || {};

    // Parse numeric total from string like "₹4,599"
    let numericSubTotal = 0;
    if (typeof orderData.total === 'string') {
      numericSubTotal = parseFloat(orderData.total.replace(/[^0-9.-]+/g, ''));
    } else {
      numericSubTotal = orderData.total || orderDoc.totalAmount || 0;
    }

    // Strip special characters from order_id — Shiprocket rejects # and other symbols
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9-_]/g, '');

    // Build Shiprocket order payload
    const shiprocketPayload = {
      order_id: cleanOrderId,
      order_date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      billing_customer_name: shippingDetails.firstName || orderData.name || orderDoc.name,
      billing_last_name: shippingDetails.lastName || '',
      billing_address: shippingDetails.address || 'Address Pending',
      billing_city: shippingDetails.city || 'Unknown',
      billing_pincode: String(shippingDetails.postcode || '000000'),
      billing_state: shippingDetails.state || 'Unknown',
      billing_country: 'India',
      billing_email: orderData.email || orderDoc.email || 'customer@example.com',
      billing_phone: String(shippingDetails.phone || '0000000000'),
      shipping_is_billing: true,
      order_items: (orderData.payload || orderDoc.payload || []).map((item, idx) => ({
        name: item.title || item.name || 'Product Item',
        sku: item.id || item.sku || `SKU-${cleanOrderId}-${idx}`,
        units: item.quantity || item.cartQuantity || 1,
        selling_price: typeof item.price === 'string'
          ? parseFloat(item.price.replace(/,/g, ''))
          : (item.price || 0),
      })),
      payment_method: 'Prepaid',
      sub_total: numericSubTotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    console.log('[Shiprocket] Creating order:', orderId);

    const { response, data } = await shiprocketFetch(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      {
        method: 'POST',
        body: JSON.stringify(shiprocketPayload),
      }
    );

    if (!response.ok) {
      console.error('[Shiprocket] Create order API error:', JSON.stringify(data));
      throw new Error(data.message || `Shiprocket returned status ${response.status}`);
    }

    // Save Shiprocket IDs to MongoDB
    orderDoc.shiprocketOrderId = data.order_id?.toString() || '';
    orderDoc.shipmentId = data.shipment_id?.toString() || '';
    orderDoc.trackingStatus = 'processing';
    await orderDoc.save();

    console.log('[Shiprocket] Order created. Shipment ID:', orderDoc.shipmentId);

    // Auto-chain: Generate AWB immediately after successful order creation
    if (orderDoc.shipmentId) {
      try {
        await generateAWBForOrder(orderDoc);
      } catch (awbError) {
        // AWB failure is non-fatal — order is already created on Shiprocket
        console.error('[Shiprocket] AWB auto-generation failed (non-fatal):', awbError.message);
      }
    }

    return NextResponse.json({ success: true, shipment: data });

  } catch (error) {
    console.error('[Shiprocket] Create Order Error:', error.message);

    // Mark order as pending_sync so we can retry later
    if (orderDoc) {
      try {
        orderDoc.trackingStatus = 'pending_sync';
        await orderDoc.save();
      } catch (dbErr) {
        console.error('[Shiprocket] Failed to mark order as pending_sync:', dbErr.message);
      }
    }

    // Return 200 so the client doesn't see an error — customer checkout is already confirmed
    return NextResponse.json({
      success: false,
      error: 'Shiprocket sync deferred. Order is saved locally.',
    }, { status: 200 });
  }
}

/**
 * Auto-generate AWB for an order after Shiprocket order creation.
 * Updates the MongoDB document with awbCode and courierName.
 */
async function generateAWBForOrder(orderDoc) {
  console.log('[Shiprocket] Auto-generating AWB for shipment:', orderDoc.shipmentId);

  const { response, data } = await shiprocketFetch(
    'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
    {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: orderDoc.shipmentId,
        courier_id: '', // Empty = auto-assign best courier
      }),
    }
  );

  if (!response.ok) {
    throw new Error(data.message || `AWB API returned status ${response.status}`);
  }

  if (data.response && data.response.data) {
    const awbCode = data.response.data.awb_code;
    const courierName = data.response.data.courier_name;

    orderDoc.awbCode = awbCode || '';
    orderDoc.courierName = courierName || '';
    orderDoc.trackingStatus = 'assigned';
    await orderDoc.save();

    console.log('[Shiprocket] AWB assigned:', awbCode, '| Courier:', courierName);
  } else {
    throw new Error('Shiprocket returned unexpected AWB response structure.');
  }
}
