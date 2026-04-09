import ProductCard from '@/components/ui/ProductCard';
import styles from '../category/[slug]/page.module.css';
import { DUMMY_PRODUCTS } from '@/lib/dummyProducts';

export default function ShopPage() {
  return (
    <div className={`container animate-fade-in ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>All Products</h1>
        <p className={styles.subtitle}>Browse our complete collection of premium home decor.</p>
      </div>

      <div className={styles.grid}>
        {DUMMY_PRODUCTS.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
