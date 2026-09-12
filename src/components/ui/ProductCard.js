'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './ProductCard.module.css';
import { getDisplayPrice, getOldPrice } from '@/lib/priceUtils';
import { getProductUrl } from '@/lib/slugUtils';

export default function ProductCard({ product }) {
  const { cartItems, addToCart, initiateBuyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const baseImages = (product?.images?.length ? product.images : [
    product?.image || '/bedsheets.png',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80'
  ]).filter(Boolean);

  const encodeImg = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) return url;
    return url.split('/').map(p => encodeURIComponent(p)).join('/');
  };

  const firstImg = encodeImg(baseImages[0] || '/bedsheets.png');
  const secondImg = baseImages[1] ? encodeImg(baseImages[1]) : '';
  const hasSecondImg = Boolean(secondImg && secondImg !== firstImg);

  const currentPrice = getDisplayPrice(product);
  const oldPrice = getOldPrice(product, currentPrice);

  const inWishlist = isInWishlist(product?._id || product?.id);
  const inCart = cartItems?.some(item => (item._id || item.id) === (product?._id || product?.id));
  const isOutOfStock = product?.inStock === false || (product?.stock !== undefined && product?.stock <= 0);

  return (
    <div 
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. IMAGE CONTAINER WITH HOVER 2ND IMAGE & WISHLIST HEART */}
      <div className={styles.imageWrapper}>
        <button 
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            toggleWishlist(product); 
          }}
          aria-label="Toggle Wishlist"
          className={styles.heartBtn}
        >
          <Heart 
            size={18} 
            strokeWidth={1.5} 
            fill={inWishlist ? '#ef4444' : 'transparent'} 
            color={inWishlist ? '#ef4444' : '#4b5563'} 
          />
        </button>

        <Link href={getProductUrl(product)} className={styles.imageLink}>
          {firstImg && (firstImg.startsWith('data:video') || firstImg.endsWith('.mp4')) ? (
            <video 
              src={firstImg} 
              className={styles.image} 
              muted 
              loop 
              autoPlay 
              playsInline 
            />
          ) : (
            <div className={styles.imageContainer}>
              <img 
                src={firstImg} 
                alt={product?.title || 'Product'} 
                className={`${styles.image} ${hasSecondImg && isHovered ? styles.imageHidden : styles.imageVisible}`} 
                loading="lazy" 
              />
              {hasSecondImg && (
                <img 
                  src={secondImg} 
                  alt={`${product?.title || 'Product'} alternate view`} 
                  className={`${styles.hoverImage} ${isHovered ? styles.hoverImageVisible : styles.hoverImageHidden}`} 
                  loading="lazy" 
                />
              )}
            </div>
          )}
        </Link>
      </div>

      {/* 2. CARD CONTENT: TITLE, PRICING & ACTION BUTTONS */}
      <div className={styles.content}>
        {/* Product Title */}
        <Link href={getProductUrl(product)} className={styles.titleLink}>
          <h3 className={styles.title} title={product?.title}>
            {product?.title || 'Home Decor Essential'}
          </h3>
        </Link>

        {/* Pricing */}
        <div className={styles.priceRow}>
          <span className={styles.currentPrice}>₹{currentPrice}</span>
          {oldPrice > currentPrice && (
            <span className={styles.oldPrice}>₹{oldPrice}</span>
          )}
        </div>

        {/* Action Buttons: Add to Cart & Buy Now */}
        {isOutOfStock ? (
          <button 
            disabled 
            className={styles.outOfStockBtn}
          >
            OUT OF STOCK
          </button>
        ) : (
          <div className={styles.buttonsWrapper}>
            {inCart ? (
              <button 
                type="button"
                className={styles.addToCartBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/cart';
                }}
              >
                Go to Cart
              </button>
            ) : (
              <button 
                type="button"
                className={styles.addToCartBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product);
                  setAddedNotice(true);
                  setTimeout(() => setAddedNotice(false), 1800);
                }}
              >
                {addedNotice ? '✓ Added' : 'Add To Cart'}
              </button>
            )}

            <button 
              type="button"
              className={styles.buyNowBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                initiateBuyNow(product);
                window.location.href = '/checkout';
              }}
            >
              Buy Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
