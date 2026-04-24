// ═══════════════════════════════════════════════════════════════════════
// Shipment Helper — Shared logic for creating Shiprocket shipments
// ═══════════════════════════════════════════════════════════════════════
// Called from:
//   1. Razorpay webhook (payment.captured)
//   2. Razorpay verify route (frontend-driven)
//   3. COD order flow (immediate shipment)
//
// Prevents duplicate shipments by checking if the order already has a
// shipmentId or shiprocketOrderId before calling Shiprocket APIs.
// ═══════════════════════════════════════════════════════════════════════

import { createShiprocketOrder, assignCourier } from '@/lib/shiprocket';

/**
 * Create a Shiprocket shipment for an order document.
 * Skips if the order already has a shipmentId (prevents duplicates).
 *
 * @param {object} orderDoc - Mongoose Order document (must be populated with all fields)
 * @returns {{ success: boolean, skipped?: boolean, shipmentId?: string, awbCode?: string }}
 */
export async function createShipmentForOrder(orderDoc) {
  // ── Guard: Prevent duplicate shipments ──────────────────────────────
  // If the order already has a Shiprocket shipment, skip creation
  if (orderDoc.shipmentId || orderDoc.shiprocketOrderId) {
    console.log(
      `[Shipment] ⏭️ Skipping — order ${orderDoc.orderId} already has shipment ` +
      `(shipmentId: ${orderDoc.shipmentId}, srOrderId: ${orderDoc.shiprocketOrderId})`
    );
    return { success: true, skipped: true };
  }

  // ── Build the Shiprocket payload from order data ────────────────────
  const shippingDetails = orderDoc.shippingDetails || {};
  const isCOD = orderDoc.paymentMethod === 'COD';
  const shiprocketPaymentMethod = isCOD ? 'COD' : 'Prepaid';

  // Parse numeric total from string like "₹4,599" or use raw number
  let numericTotal = orderDoc.totalAmount || 0;
  if (typeof orderDoc.totalString === 'string') {
    const parsed = parseFloat(orderDoc.totalString.replace(/[^0-9.-]+/g, ''));
    if (!isNaN(parsed) && parsed > 0) numericTotal = parsed;
  }

  console.log(
    `[Shipment] Creating Shiprocket order for ${orderDoc.orderId} | Payment: ${shiprocketPaymentMethod}`
  );

  // ── Step 1: Create the order on Shiprocket ──────────────────────────
  const srResult = await createShiprocketOrder({
    order_id: orderDoc.orderId,
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
    total_amount: numericTotal,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  });

  // ── Step 2: Save Shiprocket IDs to MongoDB ──────────────────────────
  orderDoc.shiprocketOrderId = srResult.order_id?.toString() || '';
  orderDoc.shipmentId = srResult.shipment_id?.toString() || '';
  orderDoc.trackingStatus = 'processing';
  await orderDoc.save();

  console.log(`[Shipment] ✅ Shiprocket order created. Shipment ID: ${orderDoc.shipmentId}`);

  // ── Step 3: Auto-assign courier & generate AWB ──────────────────────
  let awbCode = '';
  if (orderDoc.shipmentId) {
    try {
      const awbResult = await assignCourier(orderDoc.shipmentId);
      orderDoc.awbCode = awbResult.awb_code || '';
      orderDoc.courierName = awbResult.courier_name || '';
      orderDoc.trackingStatus = 'assigned';
      await orderDoc.save();
      awbCode = awbResult.awb_code || '';
      console.log(`[Shipment] ✅ AWB assigned: ${awbCode} | Courier: ${orderDoc.courierName}`);
    } catch (awbError) {
      // AWB failure is non-fatal — order is already on Shiprocket
      console.error(`[Shipment] AWB auto-generation failed (non-fatal): ${awbError.message}`);
    }
  }

  return {
    success: true,
    skipped: false,
    shipmentId: orderDoc.shipmentId,
    awbCode,
  };
}
