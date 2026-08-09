'use client';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ui/ProductCard';

export default function WishlistPage() {
  const { wishlistItems } = useWishlist();

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2.25rem', fontFamily: "var(--font-primary), 'Manrope', sans-serif", fontWeight: 600, letterSpacing: '-0.025em', textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>Your Saved Wishlist</h1>
      
      {wishlistItems.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
          {wishlistItems.map((item, index) => (
            <ProductCard key={item._id || item.id || index} product={item} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1.2rem' }}>You haven't saved any items yet.</p>
          <Link href="/shop" style={{ background: '#111', color: '#fff', padding: '16px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' }}>Browse Shop</Link>
        </div>
      )}
    </div>
  );
}
