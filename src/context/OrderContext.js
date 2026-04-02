'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext();

const DUMMY_ORDERS = [
  { id: '#KHD-3109', name: 'Ravi Kumar', date: 'Oct 24, 2026', total: '₹4,599', status: 'Delivered', color: '#dcfce7', text: '#16a34a', email: 'ravi@example.com', items: 2 },
  { id: '#KHD-3108', name: 'Sneha Sharma', date: 'Oct 24, 2026', total: '₹12,400', status: 'Pending', color: '#fef3c7', text: '#d97706', email: 'sneha@example.com', items: 5 },
  { id: '#KHD-3107', name: 'Aryan Singh', date: 'Oct 23, 2026', total: '₹899', status: 'Shipped', color: '#dbeafe', text: '#2563eb', email: 'aryan@example.com', items: 1 },
];

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

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
    
    // Fast initial load from local storage
    const storedOrders = localStorage.getItem('khd_orders');
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders);
        setOrders(parsed.length > 0 ? parsed : DUMMY_ORDERS);
      } catch (e) {
        setOrders(DUMMY_ORDERS);
      }
    } else {
      setOrders(DUMMY_ORDERS);
    }

    // Background sync with Global MongoDB
    fetch('/api/orders')
      .then(res => {
        if (!res.ok) throw new Error('DB Error');
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0 && !data[0].error) {
          const mappedDbOrders = data.map(dbOrder => ({
            id: dbOrder.orderId || `#KHD-${String(dbOrder._id).substring(String(dbOrder._id).length - 4).toUpperCase()}`,
            name: dbOrder.name || (dbOrder.user && dbOrder.user.name) || 'Unknown Customer',
            email: dbOrder.email || 'customer@example.com',
            date: dbOrder.dateString || new Date(dbOrder.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            total: dbOrder.totalString || `₹${dbOrder.totalAmount || 0}`,
            status: dbOrder.status || 'Pending',
            color: dbOrder.color || (dbOrder.status === 'Delivered' ? '#dcfce7' : '#fef3c7'),
            text: dbOrder.text || (dbOrder.status === 'Delivered' ? '#16a34a' : '#d97706'),
            items: dbOrder.items || (dbOrder.payload ? dbOrder.payload.length : 1),
            payload: dbOrder.payload || [],
            // Shiprocket tracking fields
            shipmentId: dbOrder.shipmentId || null,
            awbCode: dbOrder.awbCode || null,
            courierName: dbOrder.courierName || null,
            trackingStatus: dbOrder.trackingStatus || null,
            shiprocketOrderId: dbOrder.shiprocketOrderId || null,
          }));
          
          // Deduplicate by order ID — keep the first occurrence (DB version wins)
          const seen = new Set();
          const uniqueOrders = mappedDbOrders.filter(o => {
            if (seen.has(o.id)) return false;
            seen.add(o.id);
            return true;
          });
          
          setOrders(uniqueOrders);
          saveOrdersSafely(uniqueOrders);
        }
      })
      .catch(err => console.warn('Global DB Order sync neglected:', err));
  }, []);

  /**
   * Add a new order. Saves to localStorage + MongoDB synchronously,
   * then triggers Shiprocket order creation in the background.
   * Customer sees confirmation immediately — Shiprocket runs async.
   * 
   * @param {object} orderData - Order data from checkout
   * @param {object} shippingDetails - Shipping form data (firstName, lastName, address, city, postcode, state, phone)
   */
  const addOrder = (orderData, shippingDetails = null) => {
    // Generate a unique ID using timestamp to prevent duplicates
    const timestamp = Date.now();
    const uniqueSuffix = timestamp.toString().slice(-4);
    let nextIdNum = parseInt(uniqueSuffix, 10);
    
    // Also check existing orders to guarantee uniqueness
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
      // Check for duplicate inside the setter to be safe from stale closures
      const prevIds = new Set(prev.map(o => o.id));
      let safeOrder = newOrder;
      if (prevIds.has(newOrder.id)) {
        // Extremely unlikely but handle it — append random suffix
        const fallbackId = `#KHD-${Date.now().toString().slice(-5)}`;
        safeOrder = { ...newOrder, id: fallbackId };
      }
      
      const updated = [safeOrder, ...prev];
      saveOrdersSafely(updated);

      // Step 1: Push order to MongoDB with shippingDetails
      const mongoPayload = { ...safeOrder };
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
          console.log('[OrderContext] Order saved to MongoDB:', safeOrder.id);

          // Step 2: Trigger Shiprocket in background (fire-and-forget)
          const shiprocketPayload = {
            ...safeOrder,
            orderId: safeOrder.id,
            shippingDetails: shippingDetails || {},
          };

          fetch('/api/shiprocket/createOrder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shiprocketPayload),
          })
            .then(res => res.json())
            .then(srResult => {
              if (srResult.success) {
                console.log('[OrderContext] Shiprocket order created successfully');
              } else {
                console.warn('[OrderContext] Shiprocket deferred:', srResult.error);
              }
            })
            .catch(err => {
              console.error('[OrderContext] Shiprocket background sync failed:', err.message);
            });
        })
        .catch(err => console.error('[OrderContext] MongoDB Sync Error:', err));

      return updated;
    });
    
    // Return the pre-calculated one, it's virtually guaranteed to match
    return newOrder.id;
  };

  const updateOrderStatus = (id, newStatus, color, text) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, status: newStatus, color, text } : o);
      saveOrdersSafely(updated);
      return updated;
    });
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus }}>
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
