import Product from '@/models/Product';
import Order from '@/models/Order';
import connectToDatabase from '@/lib/mongoose';

/**
 * Safely and atomically decrements the stock quantity of products in an order.
 * Ensures idempotency using the Order's isStockDecremented field.
 * 
 * @param {object} order - The order document/object to decrement stock for.
 */
export async function decrementOrderStock(order) {
  if (!order) return;

  try {
    const db = await connectToDatabase();
    if (!db) {
      console.warn('[decrementOrderStock] Database offline. Stock decrement skipped.');
      return;
    }

    // Find the order using its ID to get a fresh copy from the database
    const orderIdQuery = order._id ? { _id: order._id } : { orderId: order.orderId };
    const freshOrder = await Order.findOne(orderIdQuery);
    if (!freshOrder) {
      console.warn(`[decrementOrderStock] Order not found for query:`, orderIdQuery);
      return;
    }

    // Guard: ensure stock hasn't already been decremented
    if (freshOrder.isStockDecremented) {
      console.log(`[decrementOrderStock] Stock already decremented for order: ${freshOrder.orderId}`);
      return;
    }

    // Atomically set isStockDecremented to true to prevent race conditions
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: freshOrder._id, isStockDecremented: { $ne: true } },
      { $set: { isStockDecremented: true } },
      { new: true }
    );

    if (!updatedOrder) {
      console.log(`[decrementOrderStock] Order ${freshOrder.orderId} was updated concurrently. Skipping stock decrement.`);
      return;
    }

    console.log(`[decrementOrderStock] Processing stock decrement for order: ${freshOrder.orderId}`);

    // Parse payload if it's stringified
    let items = freshOrder.payload;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error('[decrementOrderStock] Failed to parse payload string:', e);
        items = [];
      }
    }

    if (!Array.isArray(items)) {
      console.warn('[decrementOrderStock] Order payload is not an array:', items);
      return;
    }

    for (const item of items) {
      const rawId = item._id || item.id || '';
      const cleanProductId = rawId.split('-')[0]; // Strip variant suffixes (e.g. -color-size)
      const qty = Number(item.quantity) || 1;

      if (!cleanProductId) {
        console.warn('[decrementOrderStock] Missing product ID in item:', item);
        continue;
      }

      try {
        const product = await Product.findById(cleanProductId);
        if (product) {
          const currentStock = product.stock !== undefined ? product.stock : 10;
          const newStock = Math.max(0, currentStock - qty);
          product.stock = newStock;
          
          // Automatically mark as out of stock if quantity reaches 0 or less
          if (newStock <= 0) {
            product.inStock = false;
          }

          await product.save();
          console.log(`[decrementOrderStock] Decremented product ${cleanProductId} stock: ${currentStock} -> ${newStock}. inStock: ${product.inStock}`);
        } else {
          console.warn(`[decrementOrderStock] Product not found in database: ${cleanProductId}`);
        }
      } catch (err) {
        console.error(`[decrementOrderStock] Error updating product ${cleanProductId} stock:`, err);
      }
    }
  } catch (error) {
    console.error('[decrementOrderStock] Error in stock decrement process:', error);
  }
}
