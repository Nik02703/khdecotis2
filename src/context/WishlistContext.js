'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('khd_wishlist');
    if (stored) {
      try {
        setWishlistItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse wishlist");
      }
    }
    
    // Defer the saving mechanism until after the state has absorbed the loaded data
    setTimeout(() => setHasLoaded(true), 10);
  }, []);

  useEffect(() => {
    if (isMounted && hasLoaded) {
      try {
        const slimWishlist = wishlistItems.map(item => {
          const { description, reviews, ...rest } = item;
          let safeImages = rest.images?.map(img => img && img.length > 100000 ? null : img).filter(Boolean) || [];
          if(safeImages.length === 0 && rest.image && rest.image.length < 100000) {
            safeImages = [rest.image];
          }
          return { ...rest, images: safeImages.length > 0 ? safeImages : null };
        });
        localStorage.setItem('khd_wishlist', JSON.stringify(slimWishlist));
      } catch (error) {
        console.warn('Wishlist localStorage limit exceeded or failed:', error);
      }
    }
  }, [wishlistItems, isMounted, hasLoaded]);

  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => (item._id || item.id) === (product._id || product.id));
      if (exists) {
        return prev.filter(item => (item._id || item.id) !== (product._id || product.id));
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => (item._id || item.id) === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
