'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('khd_cart');
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
    const storedBuyNow = sessionStorage.getItem('khd_buynow');
    if (storedBuyNow) {
      try {
        setBuyNowItem(JSON.parse(storedBuyNow));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        // Strip out potentially huge text/base64 fields before persisting to localStorage
        const slimCart = cartItems.map(item => {
          const { description, reviews, ...rest } = item;
          let safeImages = rest.images?.map(img => img && img.length > 100000 ? null : img).filter(Boolean) || [];
          if(safeImages.length === 0 && rest.image && rest.image.length < 100000) {
            safeImages = [rest.image];
          }
          return { ...rest, images: safeImages.length > 0 ? safeImages : null };
        });
        localStorage.setItem('khd_cart', JSON.stringify(slimCart));
      } catch (error) {
        console.warn('Cart localStorage limit exceeded or failed:', error);
      }
    }
  }, [cartItems, isMounted]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => (item._id || item.id) === (product._id || product.id));
      if (existing) {
        return prev.map(item => 
          (item._id || item.id) === (product._id || product.id) ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => (item._id || item.id) !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => prev.map(item => 
      (item._id || item.id) === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => setCartItems([]);

  const initiateBuyNow = (product, quantity = 1) => {
    const item = { ...product, quantity };
    setBuyNowItem(item);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('khd_buynow', JSON.stringify(item));
    }
  };

  const clearBuyNow = () => {
    setBuyNowItem(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('khd_buynow');
    }
  };

  const applyCoupon = async (code) => {
    const cleanCode = code.toUpperCase().trim();
    
    // 1. Fallback built-in standards
    if (cleanCode === 'SAVE10' || cleanCode === 'DISCOUNT10') {
      setCoupon({ code: cleanCode, type: 'percent', value: 10 });
      return { success: true, message: `Coupon ${cleanCode} applied! 10% off.` };
    } else if (cleanCode === 'FLAT500') {
      setCoupon({ code: cleanCode, type: 'flat', value: 500 });
      return { success: true, message: `Coupon ${cleanCode} applied! ₹500 off.` };
    }

    // 2. Dynamically verify against custom admin-generated coupons via global MongoDB
    try {
      const res = await fetch(`/api/coupons?code=${cleanCode}`);
      if (res.ok) {
        const customMatch = await res.json();
        if (customMatch && !customMatch.error) {
          setCoupon({ code: customMatch.code, type: customMatch.type, value: customMatch.value });
          return { success: true, message: `Coupon ${customMatch.code} applied! ${customMatch.type === 'percent' ? customMatch.value + '%' : '₹' + customMatch.value} off.` };
        }
      }
    } catch (e) {
      console.warn("Failed to fetch custom coupons natively via MongoDB", e);
    }

    return { success: false, message: 'Invalid or expired coupon code' };
  };

  const removeCoupon = () => setCoupon(null);

  const getCartSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getDiscountAmount = () => {
    if (!coupon) return 0;
    const subtotal = getCartSubtotal();
    if (coupon.type === 'percent') return (subtotal * coupon.value) / 100;
    if (coupon.type === 'flat') return Math.min(subtotal, coupon.value);
    return 0;
  };

  const getCartTotal = () => {
    return Math.max(0, getCartSubtotal() - getDiscountAmount());
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart, getCartSubtotal, getDiscountAmount, coupon, applyCoupon, removeCoupon, buyNowItem, initiateBuyNow, clearBuyNow }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
