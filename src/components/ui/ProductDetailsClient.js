'use client';
import { useState, useEffect } from 'react';
import { Share2, Heart, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import MinimalProductCarousel from './MinimalProductCarousel';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useProducts } from '@/context/ProductContext';


export default function ProductDetailsClient({ product: serverProduct, productId, similarProducts = [] }) {
  const { products } = useProducts();
  const clientProduct = products.find(p => (p._id || p.id) === productId);
  const product = clientProduct || serverProduct || null;

  // Build images array: merge product images + any per-color images that aren't already in the array
  const baseImages = product?.images?.length ? product.images : [
    '/bedsheets.png',
    'https://images.unsplash.com/photo-1522771731478-4eb4f9446d6f?w=800&q=80',
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80'
  ];
  const colorImages = (product?.colors || []).map(c => c.imageUrl).filter(Boolean);
  
  const encodeImg = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url.split('/').map(p => encodeURIComponent(p)).join('/');
  };

  const images = [...new Set([...baseImages, ...colorImages])].map(encodeImg);

  const colors = product?.colors || [];

  const sizes = product?.sizes || [];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeColor, setActiveColor] = useState(colors[0]?.name || "");
  const [activeSize, setActiveSize] = useState(sizes[0]?.name || "");
  const [accordion, setAccordion] = useState({ details: false, specs: false });
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const { cartItems, addToCart, initiateBuyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Derive matching variant safely with optional chaining
  const selectedVariant = product?.variants?.find(
    v => (!activeColor || v.color === activeColor) && (!activeSize || v.size === activeSize)
  );

  // Derive price: size-specific price > variant price > base product price
  const selectedSize = sizes.find(s => s.name === activeSize);
  const displayPrice = selectedSize?.price || selectedVariant?.price || product?.price || 1599;

  // Sync image with color selection or variant when selections change
  useEffect(() => {
    // Check if selected color has a dedicated image
    const selectedColor = colors.find(c => c.name === activeColor);
    if (selectedColor?.imageUrl && images) {
      const idx = images.findIndex(img => img === encodeImg(selectedColor.imageUrl));
      if (idx !== -1) {
        setActiveImageIdx(idx);
      } else {
        // Image not in the gallery yet — show it as the first image by prepending temporarily
        // We just set index 0 and let the user see the color-specific image
        setActiveImageIdx(0);
      }
      return;
    }
    // Fallback to variant image
    if (selectedVariant?.imageUrl && images) {
      const idx = images.findIndex(img => img === encodeImg(selectedVariant.imageUrl));
      if (idx !== -1) setActiveImageIdx(idx);
    }
  }, [activeColor, selectedVariant]);

  if (!product) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading product details...</div>;
  }

  const inCart = cartItems.some(item => (item._id || item.id) === (product._id || product.id) + '-' + activeColor + '-' + activeSize);

  const nextImg = () => setActiveImageIdx((i) => (i + 1) % images.length);
  const prevImg = () => setActiveImageIdx((i) => (i - 1 + images.length) % images.length);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'start', borderBottom: '1px solid #e5e5e5' }}>
      
        <div style={{ position: 'sticky', top: '100px', width: '100%', background: '#f5f5f5', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          
          {/* Top Overlays */}
          <div style={{ position: 'absolute', top: '24px', left: '24px', background: '#000', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: '4px', letterSpacing: '1px', zIndex: 20 }}>
            STEAL DEAL
          </div>
          
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '16px', color: '#333', zIndex: 20 }}>
            <button 
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Product link copied to clipboard!'); }} 
              style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
            >
              <Share2 size={20} strokeWidth={1.5} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); toggleWishlist(product); }} 
              style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
            >
              <Heart 
                size={20} 
                strokeWidth={1.5} 
                fill={isInWishlist(product._id || product.id) ? '#ef4444' : 'transparent'} 
                color={isInWishlist(product._id || product.id) ? '#ef4444' : '#333'} 
              />
            </button>
          </div>

          {/* Main Image/Video */}
          <div style={{ width: '100%', position: 'relative' }}>
            {(images[activeImageIdx]?.startsWith('data:video') || images[activeImageIdx]?.endsWith('.mp4')) ? (
              <video src={images[activeImageIdx]} controls autoPlay muted loop style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : (
              <img src={images[activeImageIdx]} alt="Product view" style={{ width: '100%', height: 'auto', display: 'block' }} />
            )}

            {/* Navigation Arrows */}
            <button onClick={prevImg} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#111', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <ChevronLeft size={32} strokeWidth={1.5} />
            </button>
            <button onClick={nextImg} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#111', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <ChevronRight size={32} strokeWidth={1.5} />
            </button>

            {/* Pagination Dots */}
            <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 20, background: 'rgba(255,255,255,0.4)', padding: '6px 12px', borderRadius: '16px' }}>
              {images.map((_, idx) => (
                <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === activeImageIdx ? '#000' : 'rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'background 0.3s' }} onClick={() => setActiveImageIdx(idx)} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem 10%', background: '#fff' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px 0' }}>{product?.title || "Khaki Beige-Clove Field Tote Bag"}</h1>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#000' }}>₹{displayPrice}</span>
            <span style={{ fontSize: '1.2rem', color: '#a3a3a3', textDecoration: 'line-through', fontWeight: 500 }}>₹{Math.floor(displayPrice * 2.3)}</span>
            <span style={{ fontSize: '0.8rem', color: '#a3a3a3', fontWeight: 500 }}>MRP Inclusive of all taxes</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', color: '#2aaa7d', fontSize: '1.1rem' }}>
              {'★★★★★'.split('').map((s,i) => <span key={i}>{s}</span>)}
            </div>
            <span style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>4.7</span>
            <span style={{ fontSize: '0.9rem', color: '#737373' }}>(29 reviews)</span>
          </div>

          {colors.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#000' }}>COLOR</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {colors.map(c => (
                  <div key={c.name} onClick={() => setActiveColor(c.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', maxWidth: '60px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.hex, border: activeColor === c.name ? '2px solid #000' : '1px solid #e5e5e5', padding: '2px', outlineOffset: '2px', boxShadow: activeColor === c.name ? 'inset 0 0 0 2px #fff' : 'none' }}></div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.1 }}>{c.name.split(' ').map((w,i)=><div key={i}>{w}</div>)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#000' }}>SIZE</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {sizes.map(s => (
                  <button key={s.name} onClick={() => setActiveSize(s.name)} style={{ background: activeSize === s.name ? '#111' : '#fff', color: activeSize === s.name ? '#fff' : '#111', border: '1px solid #e5e5e5', padding: '10px 18px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="cta-container" style={{ display: 'flex', gap: '16px', marginBottom: '1.5rem' }}>
            {product?.inStock === false ? (
              <button 
                disabled
                style={{ width: '100%', background: '#d4d4d4', color: '#737373', fontSize: '1.1rem', fontWeight: 800, padding: '16px', border: 'none', borderRadius: '4px', cursor: 'not-allowed', letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                OUT OF STOCK
              </button>
            ) : (
              <>
                {inCart ? (
                  <Link href="/cart" style={{ textDecoration: 'none', flex: 1 }}>
                    <button style={{ width: '100%', background: '#111', color: '#fff', fontSize: '1.1rem', fontWeight: 800, padding: '16px', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'background 0.2s' }}>
                      GO TO CART
                    </button>
                  </Link>
                ) : (
                  <button 
                    onClick={() => { 
                      const variantProduct = { ...product, _id: (product._id || product.id) + '-' + activeColor + '-' + activeSize, price: displayPrice, selectedColor: activeColor, selectedSize: activeSize, images: [images[activeImageIdx], ...images] };
                      addToCart(variantProduct, 1); alert('Item added to Shopping Bag!'); 
                    }} 
                    style={{ flex: 1, background: '#22c55e', color: '#fff', fontSize: '1.1rem', fontWeight: 800, padding: '16px', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.target.style.background = '#16a34a'}
                    onMouseOut={(e) => e.target.style.background = '#22c55e'}
                  >
                    ADD TO CART
                  </button>
                )}
                <button 
                  onClick={() => { 
                    const variantProduct = { ...product, _id: (product._id || product.id) + '-' + activeColor + '-' + activeSize, price: displayPrice, selectedColor: activeColor, selectedSize: activeSize, images: [images[activeImageIdx], ...images] };
                    initiateBuyNow(variantProduct, 1); window.location.href = '/checkout'; 
                  }} 
                  style={{ flex: 1, background: '#111', color: '#fff', fontSize: '1.1rem', fontWeight: 800, padding: '16px', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'background 0.2s' }}
                >
                  BUY NOW
                </button>
              </>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter Pincode To Check Delivery"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPincode(val);
                  if (val.length < 6) setPincodeResult(null);
                }}
                style={{ flex: 1, padding: '16px', border: '1px solid #e5e5e5', borderRadius: '4px', background: '#fafafa', outline: 'none', fontSize: '0.9rem' }}
              />
              <button
                disabled={pincode.length !== 6}
                onClick={() => { if (pincode.length === 6) setPincodeResult(pincode); }}
                style={{
                  background: pincode.length === 6 ? '#fff' : '#f5f5f5',
                  color: pincode.length === 6 ? '#1a1a1a' : '#a3a3a3',
                  border: pincode.length === 6 ? '1px solid #1a1a1a' : '1px solid #e5e5e5',
                  padding: '0 24px', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem',
                  cursor: pincode.length === 6 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { if (pincode.length === 6) { e.currentTarget.style.background='#1a1a1a'; e.currentTarget.style.color='#fff'; } }}
                onMouseOut={e => { if (pincode.length === 6) { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#1a1a1a'; } }}
              >
                CHECK
              </button>
            </div>

            {/* Inline delivery result — no popup */}
            {pincodeResult && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>Estimated Delivery within 1 week</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path><path d="M12 6v6l4 2"></path></svg>
                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>COD Available</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingBottom: '32px', borderBottom: '1px solid #e5e5e5', textAlign: 'center' }}>
            {['Bedsheets', 'Comforter', 'Blankets', 'Dohars'].includes(product?.category) ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>100%<br/>Cotton</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Breathable<br/>Fabric</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Machine<br/>Washable</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Premium<br/>Quality</span>
                </div>
              </>
            ) : product?.category === 'Mattress' || product?.category === 'Pillows' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#525252', letterSpacing: '1px' }}>Ergo</span>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Support</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Long<br/>Lasting</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Easy<br/>Care</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>High<br/>Density</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Handcrafted<br/>Details</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Premium<br/>Materials</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#525252', letterSpacing: '1px' }}>Eco</span>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Friendly</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path></svg>
                  <span style={{ fontSize: '0.7rem', color: '#737373', lineHeight: 1.2 }}>Exclusive<br/>Design</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              'Product Details', 
              'Responsible Design', 
              'Care', 
              'Delivery Time & Returns',
              ...(sizes.length > 0 ? ['Dimensions'] : [])
            ].map((item, i) => (
              <div key={item} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <button 
                  onClick={() => setAccordion(p => ({...p, [item]: !p[item]}))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {item}
                  {accordion[item] ? <ChevronUp size={20} color="#737373" /> : <ChevronDown size={20} color="#737373" />}
                </button>
                {accordion[item] && (
                  <div style={{ paddingBottom: '24px', fontSize: '0.9rem', color: '#525252', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {item === 'Product Details' && product?.productDetails ? product.productDetails : 
                     item === 'Dimensions' ? sizes.find(s => s.name === activeSize)?.dimensions || 'Select a size to view dimensions.' : 
                     `Detailed information mapping to the specific ${item.toLowerCase()} constraint goes here filling out the layout.`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* MORE PRODUCTS CROSSLINK */}
      {similarProducts.length > 0 && (
        <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '4rem', paddingBottom: '4rem', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem', fontFamily: 'Outfit, sans-serif' }}>More Products To Browse</h2>
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <MinimalProductCarousel products={similarProducts} />
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
           div[style*="grid-template-columns: minmax"] {
             grid-template-columns: 1fr !important;
           }
           div[style*="padding: 2rem 10%"] {
             padding: 1.5rem 5% !important;
           }
           .cta-container {
             flex-direction: column;
           }
           .cta-container button, .cta-container a {
             width: 100%;
           }
        }
        @media (max-width: 600px) {
           div[style*="repeat(4"] {
             grid-template-columns: repeat(2, 1fr) !important;
             gap: 24px !important;
             padding-bottom: 24px !important;
           }
        }
      `}} />
    </div>
  );
}
