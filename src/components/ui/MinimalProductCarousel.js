'use client';
import { useRef } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

export default function MinimalProductCarousel({ title, products = [] }) {
  const scrollRef = useRef(null);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ marginTop: '4rem', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', color: '#000', letterSpacing: '0.5px', marginLeft: '16px' }}>
        {title}
      </h2>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div 
          ref={scrollRef}
          style={{ 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingBottom: '16px',
            scrollBehavior: 'smooth'
          }}
        >
          {products.map((item, idx) => (
            <div 
              key={idx} 
              style={{ minWidth: '220px', maxWidth: '220px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('img');
                const nextSrc = item.images?.[1] || item.images?.[0] || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80';
                if(img) img.src = nextSrc;
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img');
                const src = item.images?.[0] || item.image || '/bedsheets.png';
                if(img) img.src = src;
              }}
            >
              <div style={{ position: 'relative', background: '#f5f5f5', borderRadius: '4px', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', marginBottom: '12px', overflow: 'hidden' }}>
                <button 
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}
                  onClick={(e) => { e.preventDefault(); toggleWishlist(item); }}
                >
                  <Heart size={24} strokeWidth={1.5} fill={isInWishlist(item._id) ? '#ef4444' : 'transparent'} color={isInWishlist(item._id) ? '#ef4444' : '#525252'} />
                </button>
                <img src={item.images?.[0] || item.image || '/bedsheets.png'} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'transform 0.4s ease' }} className="carousel-product-img" />
              </div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 4px 0', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#000' }}>₹{item.price}</span>
                <span style={{ fontSize: '0.75rem', color: '#a3a3a3', textDecoration: 'line-through', fontWeight: 600 }}>₹{Math.floor(item.price * 2.3)}</span>
              </div>
            </div>
          ))}
        </div>


      </div>

      <style dangerouslySetInnerHTML={{__html: `
        div::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
