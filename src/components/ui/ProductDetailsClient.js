'use client';
import { useState } from 'react';
import { Share2, Heart, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import MinimalProductCarousel from './MinimalProductCarousel';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useProducts } from '@/context/ProductContext';
import { DUMMY_PRODUCTS } from '@/app/page';

export default function ProductDetailsClient({ product: serverProduct, productId }) {
  const { products } = useProducts();
  const clientProduct = products.find(p => (p._id || p.id) === productId);
  const product = clientProduct || serverProduct || null;

  const images = product?.images?.length ? product.images : [
    '/bedsheets.png',
    'https://images.unsplash.com/photo-1522771731478-4eb4f9446d6f?w=800&q=80',
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80'
  ];

  const colors = product?.colors || [];

  const sizes = product?.sizes || [];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeColor, setActiveColor] = useState(colors[0]?.name || "");
  const [activeSize, setActiveSize] = useState(sizes[0]?.name || "");
  const [accordion, setAccordion] = useState({ details: false, specs: false });
  const { cartItems, addToCart, initiateBuyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!product) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading product details...</div>;
  }

  const inCart = cartItems.some(item => (item._id || item.id) === (product._id || product.id));

  const nextImg = () => setActiveImageIdx((i) => (i + 1) % images.length);
  const prevImg = () => setActiveImageIdx((i) => (i - 1 + images.length) % images.length);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'stretch', borderBottom: '1px solid #e5e5e5' }}>
      
        {/* LEFT COLUMN: Gallery */}
        <div style={{ position: 'relative', width: '100%', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
          <div style={{ position: 'absolute', top: '24px', left: '24px', background: '#000', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: '4px', letterSpacing: '1px' }}>
            STEAL DEAL
          </div>
          
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '16px', color: '#333', zIndex: 10 }}>
            <button 
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Product link copied to clipboard!'); }} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <Share2 size={24} strokeWidth={1.5} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); toggleWishlist(product); }} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <Heart 
                size={24} 
                strokeWidth={1.5} 
                fill={isInWishlist(product._id || product.id) ? '#ef4444' : 'transparent'} 
                color={isInWishlist(product._id || product.id) ? '#ef4444' : '#333'} 
              />
            </button>
          </div>

          <div style={{ width: '100%', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <button onClick={prevImg} style={{ position: 'absolute', left: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a3a3a3', zIndex: 10 }}>
              <ChevronLeft size={48} strokeWidth={1} />
            </button>
            {(images[activeImageIdx]?.startsWith('data:video') || images[activeImageIdx]?.endsWith('.mp4')) ? (
              <video src={images[activeImageIdx]} controls autoPlay muted loop style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            ) : (
              <img src={images[activeImageIdx]} alt="Product view" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            )}
            <button onClick={nextImg} style={{ position: 'absolute', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a3a3a3', zIndex: 10 }}>
              <ChevronRight size={48} strokeWidth={1} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', paddingBottom: '32px' }}>
            {images.map((_, idx) => (
              <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === activeImageIdx ? '#2aaa7d' : '#d4d4d4', cursor: 'pointer' }} onClick={() => setActiveImageIdx(idx)} />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem 10%', background: '#fff' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px 0' }}>{product?.title || "Khaki Beige-Clove Field Tote Bag"}</h1>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#000' }}>₹{product?.price || 1599}</span>
            <span style={{ fontSize: '1.2rem', color: '#a3a3a3', textDecoration: 'line-through', fontWeight: 500 }}>₹{Math.floor((product?.price||1599) * 2.3)}</span>
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
                    onClick={() => { addToCart(product, 1); alert('Item added to Shopping Bag!'); }} 
                    style={{ flex: 1, background: '#22c55e', color: '#fff', fontSize: '1.1rem', fontWeight: 800, padding: '16px', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.target.style.background = '#16a34a'}
                    onMouseOut={(e) => e.target.style.background = '#22c55e'}
                  >
                    ADD TO CART
                  </button>
                )}
                <button 
                  onClick={() => { initiateBuyNow(product, 1); window.location.href = '/checkout'; }} 
                  style={{ flex: 1, background: '#111', color: '#fff', fontSize: '1.1rem', fontWeight: 800, padding: '16px', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'background 0.2s' }}
                >
                  BUY NOW
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
            <input type="text" placeholder="Enter Pincode To Check Delivery" style={{ flex: 1, padding: '16px', border: '1px solid #e5e5e5', borderRadius: '4px', background: '#fafafa', outline: 'none', fontSize: '0.9rem' }} id="pincodeCheck" />
            <button onClick={() => { const val = document.getElementById('pincodeCheck')?.value; if(val?.length > 4) alert('Delivery is available for ' + val + ' within 2-3 business days!'); else alert('Please enter a valid Pincode.'); }} style={{ background: '#fff', color: '#1a1a1a', border: '1px solid #1a1a1a', padding: '0 24px', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background='#1a1a1a'; e.currentTarget.style.color='#fff'; }} onMouseOut={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#1a1a1a'; }}>CHECK</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingBottom: '32px', borderBottom: '1px solid #e5e5e5', textAlign: 'center' }}>
            {product?.category === 'Bedding' || product?.category === 'Bedsheets' || product?.category === 'Comforter' ? (
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
      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '4rem', paddingBottom: '4rem', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem', fontFamily: 'Outfit, sans-serif' }}>More Products To Browse</h2>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <MinimalProductCarousel products={DUMMY_PRODUCTS} />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
           div[style*="grid-template-columns: minmax"] {
             grid-template-columns: 1fr !important;
           }
           div[style*="padding: 2rem 10%"] {
             padding: 1.5rem 5% !important;
           }
           div[style*="height: 600px"] {
             height: 400px !important;
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
