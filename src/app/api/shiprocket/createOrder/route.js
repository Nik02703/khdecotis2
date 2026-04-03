import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { createShiprocketOrder, assignCourier } from '@/lib/shiprocket';

/**
 * POST /api/shiprocket/createOrder
 * 
 * Called in the background after an order is saved to MongoDB.
 * Maps our order fields to Shiprocket's required format, creates
 * the order on Shiprocket, then auto-chains AWB generation.
 * 
 * Handles both COD and Prepaid orders based on paymentMethod in DB.
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

    // Determine payment method — COD orders get payment_method: "COD"
    // paymentMethod in DB is either 'COD' or 'PhonePe'
    const isCOD = orderDoc.paymentMethod === 'COD';
    const shiprocketPaymentMethod = isCOD ? 'COD' : 'Prepaid';

    console.log('[Shiprocket] Creating order:', orderId, '| Payment:', shiprocketPaymentMethod);

    // Use the high-level createShiprocketOrder function
    const srResult = await createShiprocketOrder({
      order_id: orderId,
      customer_name: shippingDetails.firstName || orderData.name || orderDoc.name,
      customer_last_name: shippingDetails.lastName || '',
      customer_phone: shippingDetails.phone || '0000000000',
      customer_email: orderData.email || orderDoc.email || 'customer@example.com',
      shipping_address: shippingDetails.address || 'Address Pending',
      shipping_city: shippingDetails.city || 'Unknown',
      shipping_state: shippingDetails.state || 'Unknown',
      shipping_pincode: shippingDetails.postcode || '000000',
      products: (orderData.payload || orderDoc.payload || []).map((item, idx) => ({
        name: item.title || item.name || 'Product Item',
        sku: item.id || item.sku || `SKU-${idx}`,
        quantity: item.quantity || item.cartQuantity || 1,
        price: item.price,
      })),
      payment_method: shiprocketPaymentMethod,
      total_amount: numericSubTotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    });

    // Save Shiprocket IDs to MongoDB
    orderDoc.shiprocketOrderId = srResult.order_id?.toString() || '';
    orderDoc.shipmentId = srResult.shipment_id?.toString() || '';
    orderDoc.trackingStatus = 'processing';
    await orderDoc.save();

    console.log('[Shiprocket] Order created. Shipment ID:', orderDoc.shipmentId);

    // Auto-chain: Generate AWB immediately after successful order creation
    if (orderDoc.shipmentId) {
      try {
        const awbResult = await assignCourier(orderDoc.shipmentId);
        orderDoc.awbCode = awbResult.awb_code || '';
        orderDoc.courierName = awbResult.courier_name || '';
        orderDoc.trackingStatus = 'assigned';
        await orderDoc.save();
        console.log('[Shiprocket] AWB assigned:', awbResult.awb_code);
      } catch (awbError) {
        // AWB failure is non-fatal — order is already created on Shiprocket
        console.error('[Shiprocket] AWB auto-generation failed (non-fatal):', awbError.message);
      }
    }

    return NextResponse.json({ success: true, shipment: srResult });

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
