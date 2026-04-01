'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { DUMMY_PRODUCTS } from '@/app/page';

// Core pre-seeded arrays
const SEED_DEALS = [
  { id: 'deal_1', title: 'Essentials 100% Cotton Super Soft Fitted Bedsheet', category: 'Bedding', price: 1199, oldPrice: 1990, discount: '40% OFF', images: ['/bedsheets.png'], isDealOfDay: true },
  { id: 'deal_2', title: 'Ultrasonic Reversible Blanket', category: 'Comforter', price: 2499, oldPrice: 4000, discount: '38% OFF', images: ['/Blanket.avif'], isDealOfDay: true },
  { id: 'deal_3', title: 'Waterproof Mattress Protector', category: 'Mattress', price: 999, oldPrice: 1500, discount: '33% OFF', images: ['/mattress%20protector.avif'], isDealOfDay: true },
  { id: 'deal_4', title: 'Premium Soft Cushions (Set of 2)', category: 'Cushions', price: 799, oldPrice: 1200, discount: '35% OFF', images: ['/cushions.avif'], isDealOfDay: true }
];

const SEED_NEW_ARRIVALS = [
  { id: 'new_1', title: 'Essentials 100% Cotton Super Soft Fitted Bedsheet (Green)', category: 'Bedding', price: 1199, oldPrice: 1990, images: ['/bedsheets.png', 'https://images.unsplash.com/photo-1522771731478-4eb4f9446d6f?w=800&q=80'], isNewArrival: true },
  { id: 'new_2', title: 'Luxury Hotel Quilt - King Size', category: 'Bedding', price: 3499, oldPrice: 5999, images: ['/Blanket.avif'], isNewArrival: true },
  { id: 'new_6', title: 'Premium Blackout Curtains', category: 'Decor', price: 1999, oldPrice: 3199, images: ['/curtains.png', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80'], isNewArrival: true },
  { id: 'new_8', title: 'Hand Tufted Wool Rug (5x7)', category: 'Decor', price: 5999, oldPrice: 8999, images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'], isNewArrival: true }
];

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('khd_products_db');
    if (stored) {
      setProducts(JSON.parse(stored));
    } else {
      // Merge all seeds into a unified local database array ensuring no overrides
      const initialDb = [...DUMMY_PRODUCTS, ...SEED_DEALS, ...SEED_NEW_ARRIVALS];
      setProducts(initialDb);
      localStorage.setItem('khd_products_db', JSON.stringify(initialDb));
    }
    setIsMounted(true);
  }, []);

  const addProduct = (productParams) => {
    const newProduct = {
      ...productParams,
      _id: `prod_${Date.now()}`,
      id: `prod_${Date.now()}`,
      images: productParams.images?.length > 0 ? productParams.images : ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'],
      price: Number(productParams.price) || 0,
      oldPrice: Number(productParams.oldPrice) || Math.round(Number(productParams.price) * 1.5),
      colors: productParams.colors || [],
      sizes: productParams.sizes || [],
      productDetails: productParams.productDetails || ''
    };
    
    setProducts(prev => {
      const updated = [newProduct, ...prev]; // Unshift so new items appear first
      localStorage.setItem('khd_products_db', JSON.stringify(updated));
      return updated;
    });
    return newProduct;
  };

  const removeProduct = (id) => {
    setProducts(prev => {
      const updated = prev.filter(p => (p._id || p.id) !== id);
      localStorage.setItem('khd_products_db', JSON.stringify(updated));
      return updated;
    });
  };

  const editProduct = (id, updatedParams) => {
    setProducts(prev => {
      const updated = prev.map(p => 
        (p._id || p.id) === id 
          ? { ...p, ...updatedParams, price: Number(updatedParams.price) || p.price, oldPrice: Number(updatedParams.oldPrice) || p.oldPrice, images: updatedParams.images?.length > 0 ? updatedParams.images : p.images }
          : p
      );
      localStorage.setItem('khd_products_db', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, removeProduct, editProduct, isMounted }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within ProductProvider");
  return context;
};
