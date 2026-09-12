'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

const DUMMY_ORDERS = [];

/**
 * Derive badge colors from status string
 */
const getStatusColors = (status) => {
  switch (status) {
    case 'Shipped':    return { bg: '#dbeafe', fg: '#2563eb' };
    case 'Delivered':  return { bg: '#dcfce7', fg: '#16a34a' };
    case 'Cancelled':  return { bg: '#fee2e2', fg: '#ef4444' };
    case 'Processing': return { bg: '#e0e7ff', fg: '#4f46e5' };
    case 'Pending':
    default:           return { bg: '#fef3c7', fg: '#d97706' };
  }
};

const mapDbOrder = (dbOrder) => {
  const st = dbOrder.status || 'Pending';
  const { bg, fg } = getStatusColors(st);
  return {
    id: dbOrder.orderId || `#KHD-${String(dbOrder._id).substring(String(dbOrder._id).length - 4).toUpperCase()}`,
    name: dbOrder.name || (dbOrder.user && dbOrder.user.name) || 'Unknown Customer',
    email: dbOrder.email || (dbOrder.shippingDetails && dbOrder.shippingDetails.email) || 'customer@example.com',
    date: dbOrder.dateString || new Date(dbOrder.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    total: dbOrder.totalString || `₹${dbOrder.totalAmount || 0}`,
    status: st,
    color: dbOrder.color || bg,
    text: dbOrder.text || fg,
    items: dbOrder.items || (dbOrder.payload ? dbOrder.payload.length : 1),
    payload: dbOrder.payload || [],
    shipmentId: dbOrder.shipmentId || null,
    awbCode: dbOrder.awbCode || null,
    courierName: dbOrder.courierName || null,
    trackingStatus: dbOrder.trackingStatus || null,
    shiprocketOrderId: dbOrder.shiprocketOrderId || null,
  };
};

const deduplicateOrders = (mappedDbOrders) => {
  const orderMap = new Map();
  for (const o of mappedDbOrders) {
    const existing = orderMap.get(o.id);
    if (!existing) {
      orderMap.set(o.id, o);
    } else {
      if (existing.status === 'Pending' && o.status !== 'Pending') {
        orderMap.set(o.id, o);
      }
    }
  }
  return Array.from(orderMap.values());
};

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();

  const getActiveUserEmail = useCallback(() => {
    if (user?.email) return user.email.toLowerCase().trim();
    if (typeof window !== 'undefined') {
      const localEmail = localStorage.getItem('khd_user_email');
      if (localEmail) return localEmail.toLowerCase().trim();
      try {
        const guestAddr = JSON.parse(localStorage.getItem('khd_guest_address') || '{}');
        if (guestAddr?.email) return guestAddr.email.toLowerCase().trim();
      } catch (e) {}
    }
    return null;
  }, [user]);

  const saveOrdersSafely = (ordersList) => {
    try {
      const safeOrders = ordersList.map(order => {
        if (!order.payload || !Array.isArray(order.payload)) return order;
        
        const slimPayload = order.payload.map(item => {
          const { description, reviews, images, ...rest } = item;
          let thumb = rest.image || (images?.length > 0 ? images[0] : null);
          if (thumb && thumb.length > 100000) {
            thumb = null; // Strip huge base64
          }
          return { ...rest, image: thumb };
        });
        
        return { ...order, payload: slimPayload };
      });
      localStorage.setItem('khd_orders', JSON.stringify(safeOrders));
    } catch (error) {
      console.warn('Orders localStorage mapping failed:', error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    const activeEmail = getActiveUserEmail();
    const myOrderIds = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('khd_my_order_ids') || '[]') 
      : [];

    // Fast initial load from local storage — ONLY keep orders belonging to this user
    const storedOrders = typeof window !== 'undefined' ? localStorage.getItem('khd_orders') : null;
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter(o => {
            if (activeEmail && o.email && o.email.toLowerCase() === activeEmail) return true;
            if (myOrderIds.length > 0 && o.id && myOrderIds.includes(o.id)) return true;
            return false;
          });
          setOrders(userOnly);
          saveOrdersSafely(userOnly); // Clean up any old leaked orders from localStorage
        }
      } catch (e) {
        setOrders([]);
      }
    } else {
      setOrders([]);
    }

    // Build user-specific API query (never fetch all orders for regular users)
    const queryParts = [];
    if (activeEmail) queryParts.push(`email=${encodeURIComponent(activeEmail)}`);
    if (myOrderIds.length > 0) queryParts.push(`orderIds=${encodeURIComponent(myOrderIds.join(','))}`);

    if (queryParts.length === 0) {
      return;
    }

    fetch(`/api/orders?${queryParts.join('&')}`)
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data) && (!data.length || !data[0].error)) {
          const uniqueOrders = deduplicateOrders(data.map(mapDbOrder));
          setOrders(uniqueOrders);
          saveOrdersSafely(uniqueOrders);
        }
      })
      .catch(err => console.warn('User order sync neglected:', err));
  }, [user, getActiveUserEmail]);

  /**
   * Add a new order. Saves to localStorage + MongoDB synchronously,
   * then triggers Shiprocket order creation in the background.
   */
  const addOrder = (orderData, shippingDetails = null, paymentMethod = 'COD') => {
    const timestamp = Date.now();
    const uniqueSuffix = timestamp.toString().slice(-4);
    let nextIdNum = parseInt(uniqueSuffix, 10);
    
    const existingIds = new Set(orders.map(o => o.id));
    let candidateId = `#KHD-${nextIdNum}`;
    while (existingIds.has(candidateId)) {
      nextIdNum++;
      candidateId = `#KHD-${nextIdNum}`;
    }

    const newOrder = {
      ...orderData,
      id: candidateId,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending',
      color: '#fef3c7',
      text: '#d97706'
    };
    
    setOrders(prev => {
      const prevIds = new Set(prev.map(o => o.id));
      let safeOrder = newOrder;
      if (prevIds.has(newOrder.id)) {
        const fallbackId = `#KHD-${Date.now().toString().slice(-5)}`;
        safeOrder = { ...newOrder, id: fallbackId };
      }
      
      const updated = [safeOrder, ...prev];
      saveOrdersSafely(updated);

      // Track order ID and email locally
      try {
        const myOrderIds = JSON.parse(localStorage.getItem('khd_my_order_ids') || '[]');
        if (!myOrderIds.includes(safeOrder.id)) {
          myOrderIds.push(safeOrder.id);
          localStorage.setItem('khd_my_order_ids', JSON.stringify(myOrderIds));
        }
        if (orderData.email) {
          localStorage.setItem('khd_user_email', orderData.email);
        }
      } catch (e) {}

      // Push order to MongoDB
      const mongoPayload = { ...safeOrder, paymentMethod };
      if (shippingDetails) {
        mongoPayload.shippingDetails = shippingDetails;
      }

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mongoPayload)
      })
        .then(res => res.json())
        .then(dbResult => {
          if (!dbResult.success) {
            console.warn('[OrderContext] MongoDB save returned:', dbResult);
            return;
          }
          console.log('[OrderContext] Order saved to MongoDB:', safeOrder.id, '| Payment:', paymentMethod);

          if (paymentMethod === 'COD') {
            console.log('[Shiprocket] Triggering auto-ship for COD order:', safeOrder.id);
            fetch(`/api/orders/${encodeURIComponent(safeOrder.id)}/ship`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })
              .then(res => res.json())
              .then(shipResult => {
                if (shipResult.success) {
                  console.log('[Shiprocket] Auto-ship success:', shipResult);
                  setOrders(currentOrders => {
                    const mapped = currentOrders.map(o => {
                      if (o.id === safeOrder.id) {
                        return {
                          ...o,
                          shipmentId: shipResult.shipmentId,
                          awbCode: shipResult.awbCode,
                          courierName: shipResult.courierName,
                          trackingStatus: 'processing',
                        };
                      }
                      return o;
                    });
                    saveOrdersSafely(mapped);
                    return mapped;
                  });
                } else {
                  console.warn('[Shiprocket] Auto-ship deferred/failed:', shipResult.error);
                }
              })
              .catch(err => console.error('[Shiprocket] Auto-ship network error:', err));
          }
        })
        .catch(dbErr => {
          console.error('[OrderContext] MongoDB save network failure:', dbErr);
        });

      return updated;
    });

    return newOrder.id;
  };

  /**
   * Update an order's status both locally and in MongoDB
   */
  const updateOrderStatus = async (id, newStatus) => {
    const { bg: color, fg: text } = getStatusColors(newStatus);

    setOrders(prev => {
      const updated = prev.map(order => 
        order.id === id ? { ...order, status: newStatus, color, text } : order
      );
      saveOrdersSafely(updated);
      return updated;
    });

    try {
      console.log('[OrderContext] Updating order status in DB:', id, '->', newStatus);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: newStatus, color, text })
      });
      const data = await res.json();
      if (data.success) {
        console.log('[OrderContext] ✅ DB status updated:', id, '->', newStatus);
      } else {
        console.error('[OrderContext] ❌ DB status update failed:', data.error);
      }
    } catch (err) {
      console.error('[OrderContext] ❌ DB status PATCH error:', err);
    }
  };

  /**
   * Fetch ALL orders without user email filter (for admin dashboard only).
   */
  const fetchAllOrders = async () => {
    try {
      const res = await fetch('/api/orders?admin=true');
      if (!res.ok) throw new Error('DB Error');
      const data = await res.json();
      if (data && Array.isArray(data) && (!data.length || !data[0].error)) {
        const uniqueOrders = deduplicateOrders(data.map(mapDbOrder));
        setOrders(uniqueOrders);
      }
    } catch (err) {
      console.warn('fetchAllOrders error:', err);
    }
  };

  /**
   * Look up order(s) by email or orderId (e.g., from order lookup or tracking form)
   */
  const lookupOrder = async (queryStr) => {
    if (!queryStr || !queryStr.trim()) return null;
    const clean = queryStr.trim();
    try {
      let res;
      if (clean.includes('@')) {
        res = await fetch(`/api/orders?email=${encodeURIComponent(clean)}`);
      } else {
        res = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
      }
      if (!res.ok) return null;
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const mapped = deduplicateOrders(data.map(mapDbOrder));
        setOrders(prev => deduplicateOrders([...mapped, ...prev]));
        if (clean.includes('@')) {
          localStorage.setItem('khd_user_email', clean);
        }
        return mapped;
      } else if (data && data.orderId) {
        const mapped = mapDbOrder(data);
        setOrders(prev => deduplicateOrders([mapped, ...prev]));
        try {
          const myOrderIds = JSON.parse(localStorage.getItem('khd_my_order_ids') || '[]');
          if (!myOrderIds.includes(mapped.id)) {
            myOrderIds.push(mapped.id);
            localStorage.setItem('khd_my_order_ids', JSON.stringify(myOrderIds));
          }
        } catch (e) {}
        return [mapped];
      }
      return null;
    } catch (e) {
      console.error('lookupOrder error:', e);
      return null;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, fetchAllOrders, lookupOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
