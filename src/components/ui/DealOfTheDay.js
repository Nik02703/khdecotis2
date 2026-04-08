'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './DealOfTheDay.module.css';

export default function DealOfTheDay() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(0);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { cartItems, addToCart, initiateBuyNow } = useCart();
  const { products, isMounted } = useProducts();

  useEffect(() => {
    const calculateSecondsToMidnight = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return Math.floor((midnight.getTime() - now.getTime()) / 1000);
    };

    setTimeLeft(calculateSecondsToMidnight());

    const timer = setInterval(() => {
      setTimeLeft(calculateSecondsToMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  const formatZero = (num) => num.toString().padStart(2, '0');

  if (!isMounted) return null;

  // Filter deals algorithmically mapping the dynamic isDealOfDay context
  const dynamicDeals = products.filter(p => p.isDealOfDay);
  if (dynamicDeals.length === 0) return null;

  return (
    <section className={`${styles.section} animate-fade-in`}>
      <div className={styles.leftSidebar}>
        {/* Animated Background Sunburst mapped directly from snapshot */}
        <div className={styles.rays}></div>
        <div className={styles.sidebarContent}>
          <div className={styles.titleWrap}>
            <span className={styles.wordDeal}>Deal</span>
            <span className={styles.wordOf}>of the</span>
            <span className={styles.wordDay}>DAY</span>
          </div>
          <p className={styles.endsInText}>Ends In</p>
          <div className={styles.timer}>
            <div className={styles.timeBlock}>{formatZero(h)}<span className={styles.timeLabel}>h</span></div>
            <span className={styles.colon}>:</span>
            <div className={styles.timeBlock}>{formatZero(m)}<span className={styles.timeLabel}>m</span></div>
            <span className={styles.colon}>:</span>
            <div className={styles.timeBlock}>{formatZero(s)}<span className={styles.timeLabel}>s</span></div>
          </div>
        </div>
      </div>

      <div className={styles.carouselWrapper}>
        <div className={styles.carouselTrack}>
          {dynamicDeals.map(deal => (
            <Link href={`/product/${deal._id || deal.id}`} key={deal._id || deal.id} className={styles.dealCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.cardImageWrapper}>
                <span className={styles.dealTag}>Deal Of The Day</span>
                <img src={deal.images?.[0] || 'https://via.placeholder.com/300'} alt={deal.title} className={styles.cardImg} />
                <button 
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(deal); }}
                >
                  <Heart size={24} strokeWidth={1.5} fill={isInWishlist(deal._id || deal.id) ? '#ef4444' : 'transparent'} color={isInWishlist(deal._id || deal.id) ? '#ef4444' : '#525252'} />
                </button>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.productTitle}>{deal.title}</h3>
                <p className={styles.productCategory}>{deal.category}</p>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>₹{deal.price || deal.currentPrice}</span>
                  {(() => {
                    const rawOldPrice = deal.oldPrice ? Number(deal.oldPrice) : 0;
                    const price = Number(deal.price || deal.currentPrice);
                    const effectiveOldPrice = rawOldPrice > price ? rawOldPrice : Math.round(price * 1.4);
                    const discountText = deal.discount || (effectiveOldPrice > price ? `${Math.round(((effectiveOldPrice - price) / effectiveOldPrice) * 100)}% OFF` : null);
                    return (
                      <>
                        {effectiveOldPrice > price && <span className={styles.oldPrice}>₹{effectiveOldPrice}</span>}
                        {discountText && <span className={styles.discountBadge}>{discountText}</span>}
                      </>
                    );
                  })()}
                </div>
                <div className={styles.limitedOffer}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Limited Time Offer
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', width: '100%' }}>
                  {deal?.inStock === false ? (
                    <button 
                      disabled
                      style={{ flex: 1, background: '#d4d4d4', color: '#737373', fontSize: '0.85rem', fontWeight: 800, padding: '10px 4px', border: 'none', borderRadius: '4px', cursor: 'not-allowed', letterSpacing: '1px', textTransform: 'uppercase', height: '42px' }}
                    >
                      OUT OF STOCK
                    </button>
                  ) : (
                    <>
                      <button 
                        className={styles.addToCartBtn}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart({ ...deal, price: deal.price || deal.currentPrice }, 1); alert(`${deal.title} added to cart!`); }}
                        style={{ flex: 1, background: cartItems?.some(item => (item._id || item.id) === (deal._id || deal.id)) ? '#f1f5f9' : '#fff', color: cartItems?.some(item => (item._id || item.id) === (deal._id || deal.id)) ? '#334155' : '#111', border: '1px solid #e2e8f0', padding: '10px 4px', fontSize: '0.85rem', whiteSpace: 'nowrap', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                      >
                        {cartItems?.some(item => (item._id || item.id) === (deal._id || deal.id)) ? 'In Cart' : 'Add To Cart'}
                      </button>
                      <button 
                        className={styles.addToCartBtn}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); initiateBuyNow({ ...deal, price: deal.price || deal.currentPrice }, 1); router.push('/checkout'); }}
                        style={{ flex: 1, background: '#111', color: '#fff', padding: '10px 4px', fontSize: '0.85rem', border: '1px solid #111', whiteSpace: 'nowrap', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                      >
                        Buy Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
