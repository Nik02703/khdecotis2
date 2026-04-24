'use client';

export default function ProductReviews() {
  const reviews = [
    { id: 1, author: "Aditi S.", rating: 5, date: "October 18, 2026", title: "Absolutely Luxurious Quality", content: "I was skeptical about buying home decor online, but this completely exceeded my expectations. The fabric is incredibly soft and practically glows. Shipping was lightning fast too!", img: "https://images.unsplash.com/photo-1522771731478-4eb4f9446d6f?w=400&q=80" },
    { id: 2, author: "Vikram Mehta", rating: 4, date: "October 12, 2026", title: "Great value for money", content: "Very happy with the purchase. The only reason for 4 stars is that the color is slightly darker than the picture, but honestly it looks even better in my room. Will buy again." },
    { id: 3, author: "Pooja Verma", rating: 5, date: "September 29, 2026", title: "Exactly like the luxury hotels", content: "This is the exact same feeling you get when you sleep in a 5-star hotel. Extremely breathable and doesn't trap heat at all." }
  ];

  return (
    <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--border)', fontFamily: 'Outfit, sans-serif' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: 'var(--primary)', marginBottom: '2rem' }}>Customer Reviews</h2>
      
      {/* Review Summary Block */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginBottom: '3rem', background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', minWidth: '150px' }}>
          <h3 style={{ fontSize: '4rem', fontWeight: 800, margin: 0, color: '#0f172a', lineHeight: 1 }}>4.8</h3>
          <div style={{ display: 'flex', color: '#f59e0b', justifyContent: 'center', margin: '8px 0' }}>
            {'★★★★★'.split('').map((star, i) => <span key={i} style={{ fontSize: '1.25rem' }}>{star}</span>)}
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Based on 124 Reviews</p>
        </div>
        
        <div style={{ flex: 1, minWidth: '250px' }}>
          {/* Progress bars representing rating distribution */}
          {[
            { stars: 5, pct: 82 },
            { stars: 4, pct: 12 },
            { stars: 3, pct: 4 },
            { stars: 2, pct: 2 },
            { stars: 1, pct: 0 },
          ].map((bar) => (
            <div key={bar.stars} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, width: '45px' }}>{bar.stars} Star</span>
              <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: bar.pct + '%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', width: '30px', textAlign: 'right' }}>{bar.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Review Feeds */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {reviews.map((rev) => (
          <div key={rev.id} style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }} className="review-card">
            
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0 }}>
              {rev.author.charAt(0)}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{rev.author} <span style={{ color: '#16a34a', fontSize: '0.75rem', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', fontWeight: 700 }}>Verified Buyer</span></h4>
                  <div style={{ color: '#f59e0b', letterSpacing: '2px', fontSize: '1rem', margin: '4px 0' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{rev.date}</div>
              </div>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>{rev.title}</h5>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>{rev.content}</p>
              
              {rev.img && (
                <div style={{ marginTop: '1rem', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <img src={rev.img} alt="Customer provided" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '10px 32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>Load More Reviews</button>
      </div>

    </div>
  );
}
