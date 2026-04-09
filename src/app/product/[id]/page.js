import styles from './page.module.css';
import { DUMMY_PRODUCTS } from '@/lib/dummyProducts';
import ProductDetailsClient from '@/components/ui/ProductDetailsClient';
import ProductReviews from '@/components/ui/ProductReviews';
import MinimalProductCarousel from '@/components/ui/MinimalProductCarousel';

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams || {};
  
  // Normally fetch from DB - Here we resolve from standard dummy, or defer to client context for localized saves
  const product = DUMMY_PRODUCTS.find(p => p._id === id || p.id === id) || null;

  return (
    <div className={`animate-fade-in ${styles.page}`} style={{ background: '#fff' }}>
      
      {/* Primary Layout Engine (Re-configured to exactly match specific references) */}
      <ProductDetailsClient product={product} productId={id} />

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {/* Cross-Sell References (Minimal Cards Array) */}
        <MinimalProductCarousel title="You May Also Like" products={DUMMY_PRODUCTS.slice(0, 6)} />
        
        {/* Customer Reviews Architecture (Histograms & Iterations) */}
        <ProductReviews />
      </div>

    </div>
  );
}
