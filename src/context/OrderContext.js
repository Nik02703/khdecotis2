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
      saveOrdersSafely(DUMMY_ORDERS);
    }
  }, []);

  const addOrder = (orderData) => {
    let nextIdNum = 61;
    if (orders.length > 0) {
      const ids = orders.map(o => {
        const match = String(o.id).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      const maxId = Math.max(...ids);
      if (maxId >= 61) {
        nextIdNum = maxId + 1;
      }
    }

    const newOrder = {
      ...orderData,
      id: `#KHD-${nextIdNum}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending',
      color: '#fef3c7',
      text: '#d97706'
    };
    
    setOrders(prev => {
      // Recalculate inside to be perfectly safe from stale closures
      let safeNextId = 61;
      if (prev.length > 0) {
        const prevIds = prev.map(o => {
          const match = String(o.id).match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        });
        const safeMax = Math.max(...prevIds);
        if (safeMax >= 61) safeNextId = safeMax + 1;
      }
      
      const safestOrder = { ...newOrder, id: `#KHD-${safeNextId}` };
      const updated = [safestOrder, ...prev];
      saveOrdersSafely(updated);

      // Async push to actual MongoDB
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safestOrder)
      }).catch(err => console.error("MongoDB Sync Error:", err));

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
