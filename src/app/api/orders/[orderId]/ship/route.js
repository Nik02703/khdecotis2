import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { createShiprocketOrder, assignCourier } from '@/lib/shiprocket';

/**
 * POST /api/orders/[orderId]/ship
 * 
 * Called after payment is confirmed to ship an order.
 * This is the single endpoint that orchestrates the full Shiprocket flow:
 *   1. Fetch order details from MongoDB
 *   2. Call createShiprocketOrder()
 *   3. Call assignCourier() to get AWB
 *   4. Update order status to "Shipped" in MongoDB
 *   5. Return shipment details (shipmentId, awbCode, courierName)
 * 
 * Can be called manually from admin dashboard or automatically after payment.
 */
export async function POST(req, { params }) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    }

    const { orderId } = await params;
    const decodedId = decodeURIComponent(orderId);

    console.log('[Ship Order] Starting shipment for:', decodedId);

    // Step 1: Fetch order from MongoDB
    const orderDoc = await Order.findOne({ orderId: decodedId });
    if (!orderDoc) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Prevent double-shipping
    if (orderDoc.shipmentId && orderDoc.awbCode) {
      console.log('[Ship Order] Already shipped — Shipment:', orderDoc.shipmentId, 'AWB:', orderDoc.awbCode);
      return NextResponse.json({
        success: true,
        message: 'Order is already shipped.',
        shipmentId: orderDoc.shipmentId,
        awbCode: orderDoc.awbCode,
        courierName: orderDoc.courierName,
      });
    }

    const shippingDetails = orderDoc.shippingDetails || {};

    // Determine payment method for Shiprocket
    const isCOD = orderDoc.paymentMethod === 'COD';
    const shiprocketPaymentMethod = isCOD ? 'COD' : 'Prepaid';

    // Step 2: Create order on Shiprocket (skip if already created)
    let shipmentId = orderDoc.shipmentId;
    let shiprocketOrderId = orderDoc.shiprocketOrderId;

    if (!shipmentId) {
      const srResult = await createShiprocketOrder({
        order_id: decodedId,
        customer_name: shippingDetails.firstName || orderDoc.name || 'Customer',
        customer_last_name: shippingDetails.lastName || '',
        customer_phone: shippingDetails.phone || '0000000000',
        customer_email: orderDoc.email || 'customer@example.com',
        shipping_address: shippingDetails.address || 'Address Pending',
        shipping_city: shippingDetails.city || 'Unknown',
        shipping_state: shippingDetails.state || 'Unknown',
        shipping_pincode: shippingDetails.postcode || '000000',
        products: (orderDoc.payload || []).map((item, idx) => ({
          name: item.title || item.name || 'Product Item',
          sku: item.id || item.sku || `SKU-${idx}`,
          quantity: item.quantity || item.cartQuantity || 1,
          price: item.price,
        })),
        payment_method: shiprocketPaymentMethod,
        total_amount: orderDoc.totalAmount || 0,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      });

      shipmentId = srResult.shipment_id?.toString() || '';
      shiprocketOrderId = srResult.order_id?.toString() || '';

      // Save Shiprocket IDs immediately
      orderDoc.shipmentId = shipmentId;
      orderDoc.shiprocketOrderId = shiprocketOrderId;
      orderDoc.trackingStatus = 'processing';
      await orderDoc.save();

      console.log('[Ship Order] Shiprocket order created. Shipment ID:', shipmentId);
    }

    // Step 3: Assign courier and get AWB
    let awbCode = orderDoc.awbCode;
    let courierName = orderDoc.courierName;

    if (!awbCode && shipmentId) {
      const awbResult = await assignCourier(shipmentId);
      awbCode = awbResult.awb_code || '';
      courierName = awbResult.courier_name || '';
    }

    // Step 4: Update order as "Shipped" in MongoDB
    orderDoc.awbCode = awbCode;
    orderDoc.courierName = courierName;
    orderDoc.status = 'Shipped';
    orderDoc.trackingStatus = awbCode ? 'assigned' : 'processing';
    orderDoc.color = '#dbeafe';
    orderDoc.text = '#2563eb';
    await orderDoc.save();

    console.log('[Ship Order] ✅ Order shipped:', decodedId, '| AWB:', awbCode, '| Courier:', courierName);

    return NextResponse.json({
      success: true,
      shipmentId: orderDoc.shipmentId,
      shiprocketOrderId: orderDoc.shiprocketOrderId,
      awbCode,
      courierName,
      status: 'Shipped',
    });

  } catch (error) {
    console.error('[Ship Order] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to ship order.',
    }, { status: 500 });
  }
}
