'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { cartItems, addToCart, initiateBuyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const images = product?.images?.length > 1
    ? product.images 
    : [
        product?.images?.[0] || product?.image || 'https://via.placeholder.com/400x400?text=Product+Image',
        product?.images?.[1] || product?.images?.[0] || product?.image || 'https://via.placeholder.com/400x400?text=Hover+Image'
      ].filter(Boolean);

  const currentImg = images[activeImageIdx % images.length];

  const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setActiveImageIdx(i => i + 1); };
  const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setActiveImageIdx(i => (i - 1 + images.length) % images.length); };
  
  const oldPrice = product.oldPrice || Math.round(product.price * 1.4);
  const discountStr = product.discount || (oldPrice && product.price && Number(oldPrice) > Number(product.price) ? `${Math.round(((Number(oldPrice) - Number(product.price)) / Number(oldPrice)) * 100)}% OFF` : null);

  return (
    <div className={styles.card}>
      <div 
        className={styles.imageWrapper}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setActiveImageIdx(0); }}
        style={{ position: 'relative' }}
      >
        <button 
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          aria-label="Toggle Wishlist"
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}
        >
          <Heart 
            size={24} 
            strokeWidth={1.5} 
            fill={isInWishlist(product._id || product.id) ? '#ef4444' : 'transparent'} 
            color={isInWishlist(product._id || product.id) ? '#ef4444' : '#525252'} 
          />
        </button>

        {isHovered && images.length > 1 && (
          <>
            <button onClick={prevImg} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <ChevronLeft size={20} color="#000" />
            </button>
            <button onClick={nextImg} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <ChevronRight size={20} color="#000" />
            </button>
          </>
        )}

        <Link href={`/product/${product._id || product.id}`} style={{ display: 'block', height: '100%' }}>
          {currentImg && (currentImg.startsWith('data:video') || currentImg.endsWith('.mp4')) ? (
            <video src={currentImg} className={styles.image} style={{ transition: 'opacity 0.3s ease-in-out', objectFit: 'cover', width: '100%', height: '100%' }} muted loop autoPlay playsInline />
          ) : (
            <img src={currentImg} alt={product.title} className={styles.image} loading="lazy" style={{ transition: 'opacity 0.3s ease-in-out' }} />
          )}
        </Link>
      </div>
      <div className={styles.content}>
        <Link href={`/product/${product._id || product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className={styles.title}>{product.title}</h3>
        </Link>
        <p className={styles.category}>{product.category}</p>
        <div className={styles.priceRow}>
          <span className={styles.currentPrice}>₹{product.price}</span>
          <span className={styles.oldPrice}>₹{oldPrice}</span>
          <span className={styles.discountBadge}>{discountStr}</span>
        </div>
        
        <div className={styles.buttonsWrapper}>
          {cartItems?.some(item => (item._id || item.id) === (product._id || product.id)) ? (
            <Link href="/cart" style={{ textDecoration: 'none', width: '100%' }}>
              <button className={styles.addToCartBtn} style={{ background: '#111', color: '#fff', width: '100%', padding: '10px 4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                Go To Cart
              </button>
            </Link>
          ) : (
            <button 
              className={styles.addToCartBtn} 
              onClick={(e) => { e.preventDefault(); addToCart(product); alert(`${product.title} added to cart!`); }}
              style={{ width: '100%', padding: '10px 4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
            >
              Add To Cart
            </button>
          )}
          <button 
            className={styles.addToCartBtn} 
            onClick={(e) => { e.preventDefault(); initiateBuyNow(product); window.location.href = '/checkout'; }}
            style={{ width: '100%', background: '#111', color: '#fff', padding: '10px 4px', fontSize: '0.85rem', border: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
