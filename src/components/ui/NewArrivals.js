'use client';
import { useProducts } from '@/context/ProductContext';
import styles from './NewArrivals.module.css';
import ProductCard from './ProductCard';

export default function NewArrivals() {
  const { products, isMounted } = useProducts();

  if (!isMounted) return null;

  // Filter New Arrivals natively and cap at 8 products max
  const newArrivalsData = products.filter(p => p.isNewArrival);
  const displayProducts = (newArrivalsData.length > 0 ? newArrivalsData : products).slice(0, 8);

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

        <div className={styles.productGrid}>
          {displayProducts.map(product => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
