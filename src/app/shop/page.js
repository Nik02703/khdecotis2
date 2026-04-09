'use client';
import { useProducts } from '@/context/ProductContext';
import ProductCard from '@/components/ui/ProductCard';

export default function ShopPage() {
  const { products, isMounted } = useProducts();

  return (
    <div className={`container animate-fade-in`} style={{ padding: '4rem 1rem', minHeight: '80vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'Playfair Display, serif', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem 0' }}>All Products</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Browse our complete collection of premium home decor.</p>
      </div>

      {products.length > 0 ? (
        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem', paddingBottom: '80px' }}>
          {products.map((product, idx) => (
            <ProductCard key={product._id || product.id || `prod_${idx}`} product={product} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}>
          <h3>{isMounted ? 'No products found.' : 'Loading products...'}</h3>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 600px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
      `}} />
    </div>
  );
}
