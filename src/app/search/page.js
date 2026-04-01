'use client';
import { useSearchParams } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { useProducts } from '@/context/ProductContext';
import ProductCard from '@/components/ui/ProductCard';
import { Search } from 'lucide-react';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { products, isMounted } = useProducts();

  const results = useMemo(() => {
    if (!query.trim() || !isMounted) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(product => {
      const titleMatch = product.title?.toLowerCase().includes(lowerQuery);
      const categoryMatch = product.category?.toLowerCase().includes(lowerQuery);
      const descMatch = product.description && product.description.toLowerCase().includes(lowerQuery);
      return titleMatch || categoryMatch || descMatch;
    });
  }, [query, products, isMounted]);

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '80vh' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Search Results
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Found {results.length} {results.length === 1 ? 'result' : 'results'} for "<span style={{fontWeight: 700, color: '#000'}}>{query}</span>"
        </p>
      </div>

      {results.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
          {results.map((product, index) => (
            <ProductCard key={product._id || product.id || index} product={product} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '6rem 0', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <Search size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '8px' }}>We couldn't find any products matching your query.</p>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Try searching for generic terms like "Bedsheet" or "Pillow".</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading Search Array Engine...</div>}>
      <SearchResultsContent />
    </Suspense>
  )
}
