'use client';
import { useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import styles from './NewArrivals.module.css';
import ProductCard from './ProductCard';

export default function NewArrivals() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { products, isMounted } = useProducts();

  if (!isMounted) return null;

  // Filter New Arrivals natively
  const newArrivalsData = products.filter(p => p.isNewArrival);
  const BEDDING_PRODS = newArrivalsData.filter(p => !['Decor', 'Lighting'].includes(p.category));
  const DECOR_PRODS = newArrivalsData.filter(p => ['Decor', 'Lighting'].includes(p.category));

  const currentProducts = activeIndex === 0 ? BEDDING_PRODS : DECOR_PRODS;

  return (
    <section className={styles.section}>
      <div className={`container animate-fade-in`}>
        <div className={styles.headerContainer}>
          <div className={styles.titleRow}>
            <span className={styles.newBadge}>NEW</span>
            <h2 className={styles.titleText}>Arrivals</h2>
          </div>
          <p className={styles.subtitle}>
            Be the first to explore our newest furniture and home essentials, crafted for modern homes.
          </p>
        </div>

        {/* Animated Pill Toggle mapping user requested screenshot behavior */}
        <div className={styles.toggleWrapper}>
          <div className={styles.toggleTrack}>
            <div className={styles.toggleThumb} style={{ transform: activeIndex === 0 ? 'translateX(0)' : 'translateX(100%)' }} />
            <button className={`${styles.toggleBtn} ${activeIndex === 0 ? styles.activeBtn : ''}`} onClick={() => setActiveIndex(0)}>
              Shop Bedding & Essentials
            </button>
            <button className={`${styles.toggleBtn} ${activeIndex === 1 ? styles.activeBtn : ''}`} onClick={() => setActiveIndex(1)}>
              Shop Hand Towels & Door Mats
            </button>
          </div>
        </div>

        <div className={styles.productGrid}>
          {currentProducts.map(product => (
            <ProductCard key={product._id || product.id} product={{
              _id: product._id || product.id,
              title: product.title,
              category: product.category,
              price: String(product.price).replace(',',''),
              oldPrice: String(product.oldPrice).replace(',',''),

              images: product.images
            }} />
          ))}
        </div>
      </div>
    </section>
  );
}
