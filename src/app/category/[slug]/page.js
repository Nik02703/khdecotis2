'use client';
import { useState, useMemo, use } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { useProducts } from '@/context/ProductContext';

export default function CategoryDetailsPage({ params }) {
  // Unwrap the Next.js 15 Promise-based params using React.use()
  const unwrappedParams = use(params);
  const slug = unwrappedParams?.slug || 'Category';
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);

  const [sortOrder, setSortOrder] = useState('popular');
  const [filterPrice, setFilterPrice] = useState('all');
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const { products, isMounted } = useProducts();

  // Derive products specifically for this category constraint
  const filteredProducts = useMemo(() => {
    let pool = products.filter(p => {
      if (!slug || slug === 'shop') return true;
      const cat = p?.category?.toLowerCase() || '';
      const target = slug.toLowerCase();
      
      // Alias common synonyms seamlessly handling user drops
      if (target === 'bedsheets' && (cat === 'bedding' || cat === 'bedsheets')) return true;
      if (target === 'decor' && (cat === 'decor' || cat === 'home decor' || cat === 'accessories')) return true;
      
      return cat === target;
    });
    
    // Fallback if none match (local mock expansion)
    if (pool.length === 0) {
      pool = products;
    }

    if (filterPrice === 'under1000') pool = pool.filter(p => p.price < 1000);
    if (filterPrice === '1000to3000') pool = pool.filter(p => p.price >= 1000 && p.price <= 3000);
    if (filterPrice === 'above3000') pool = pool.filter(p => p.price > 3000);

    if (sortOrder === 'lowToHigh') pool.sort((a,b) => a.price - b.price);
    if (sortOrder === 'highToLow') pool.sort((a,b) => b.price - a.price);

    return pool;
  }, [slug, sortOrder, filterPrice, products]);

  return (
    <>
      <div className="container animate-fade-in" style={{ padding: '4rem 1rem', minHeight: '80vh' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'Playfair Display, serif', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem 0' }}>{categoryName}</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Displaying {filteredProducts.length} Premium Items</p>
      </div>

      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div className="filter-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#333' }}>Filter By:</span>
          <select value={filterPrice} onChange={(e) => setFilterPrice(e.target.value)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#333', fontSize: '0.9rem', cursor: 'pointer', outline: 'none' }}>
            <option value="all">All Prices</option>
            <option value="under1000">Under ₹1,000</option>
            <option value="1000to3000">₹1,000 - ₹3,000</option>
            <option value="above3000">Above ₹3,000</option>
          </select>
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#333' }}>Sort By:</span>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#333', fontSize: '0.9rem', cursor: 'pointer', outline: 'none' }}>
            <option value="popular">Most Popular</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem', paddingBottom: '80px' }}>
           {filteredProducts.map((p, idx) => (
             <ProductCard key={p._id || p.id || `prod_${idx}`} product={p} />
           ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}>
          <h3>No products match your current filters.</h3>
          <button onClick={() => { setFilterPrice('all'); setSortOrder('popular'); }} style={{ marginTop: '1rem', background: 'transparent', color: '#2563eb', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear Filters</button>
        </div>
      )}
      </div>

      {/* Mobile Bottom Sticky Bar */}
      <div className="mobile-bottom-actions">
        <button onClick={() => setIsMobileSortOpen(true)} className="bottom-action-btn" style={{ background: 'transparent', border: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
          Sort By
        </button>
        <div style={{ width: '1px', background: '#e2e8f0', height: '24px' }} />
        <button onClick={() => setIsMobileFilterOpen(true)} className="bottom-action-btn" style={{ background: 'transparent', border: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filters
        </button>
      </div>

      {isMobileSortOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', transition: 'opacity 0.3s' }}>
          <div style={{ background: '#fff', width: '100%', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '24px', transform: 'translateY(0)', transition: 'transform 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Sort by</h3>
              <button onClick={() => setIsMobileSortOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            {[
              { id: 'popular', label: 'POPULAR' },
              { id: 'lowToHigh', label: 'LOWEST PRICE' },
              { id: 'highToLow', label: 'HIGHEST PRICE' },
              { id: 'newest', label: 'NEW TO OLD' }
            ].map(opt => (
              <div 
                key={opt.id} 
                onClick={() => { setSortOrder(opt.id); setIsMobileSortOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: sortOrder === opt.id ? '#f8fafc' : 'transparent', borderRadius: sortOrder === opt.id ? '8px' : '0', paddingLeft: sortOrder === opt.id ? '12px' : '0', transition: 'all 0.2s' }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: sortOrder === opt.id ? '6px solid #fbbf24' : '1px solid #cbd5e1', background: '#fff' }} />
                <span style={{ fontWeight: sortOrder === opt.id ? 700 : 500, fontSize: '1rem', color: '#111' }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMobileFilterOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', transition: 'opacity 0.3s' }}>
          <div style={{ background: '#fff', width: '100%', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '24px', transform: 'translateY(0)', transition: 'transform 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Filter by Price</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            {[
              { id: 'all', label: 'ALL PRICES' },
              { id: 'under1000', label: 'UNDER ₹1,000' },
              { id: '1000to3000', label: '₹1,000 TO ₹3,000' },
              { id: 'above3000', label: 'ABOVE ₹3,000' }
            ].map(opt => (
              <div 
                key={opt.id} 
                onClick={() => { setFilterPrice(opt.id); setIsMobileFilterOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: filterPrice === opt.id ? '#f8fafc' : 'transparent', borderRadius: filterPrice === opt.id ? '8px' : '0', paddingLeft: filterPrice === opt.id ? '12px' : '0', transition: 'all 0.2s' }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: filterPrice === opt.id ? '6px solid #fbbf24' : '1px solid #cbd5e1', background: '#fff' }} />
                <span style={{ fontWeight: filterPrice === opt.id ? 700 : 500, fontSize: '1rem', color: '#111' }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .mobile-bottom-actions { display: none; }
        @media (max-width: 600px) {
          .filter-bar { display: none !important; }
          .mobile-bottom-actions {
            display: flex !important;
            position: fixed;
            bottom: 0px !important;
            left: 0px;
            width: 100vw;
            background: #fff;
            border-top: 1px solid #e2e8f0;
            z-index: 99999;
            align-items: center;
            padding: 16px 0;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
            transform: translateZ(0); /* Hardware lock for iOS sticky bug */
          }
          .bottom-action-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            gap: 8px; font-weight: 600; color: #0f172a; position: relative;
          }
          .product-grid {
             grid-template-columns: repeat(2, 1fr) !important;
             gap: 12px !important;
             padding-bottom: 80px;
          }
        }
      `}} />
    </>
  );
}
