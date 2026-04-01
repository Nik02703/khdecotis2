'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, getCartCount, getCartSubtotal, getDiscountAmount, coupon, applyCoupon, removeCoupon, clearBuyNow } = useCart();
  const [openAccordion, setOpenAccordion] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });

  const handleApplyCoupon = () => {
    if (!couponInput) {
      setCouponMessage({ text: 'Please enter a coupon code.', type: 'error' });
      return;
    }
    const res = applyCoupon(couponInput);
    setCouponMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) setCouponInput('');
  };

  const subtotal = getCartSubtotal ? getCartSubtotal() : getCartTotal();
  const discountAmt = getDiscountAmount ? getDiscountAmount() : 0;
  const discountedSubtotal = subtotal - discountAmt;
  
  const shippingCharges = discountedSubtotal > 400 ? 0 : 79;
  const totalAmount = discountedSubtotal + shippingCharges;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerText}>
        SHOPPING BAG
      </header>

      {cartItems.length > 0 ? (
        <div className={styles.splitContainer}>
          
          {/* LEFT COLUMN: Cart Items */}
          <div className={styles.leftCol}>
            {cartItems.map((item, index) => (
              <div key={`${item._id || item.id || 'cart-item'}-${index}`} className={styles.cartItem}>
                <div className={styles.imageBox}>
                  <img src={item.images?.[0] || item.image || 'https://via.placeholder.com/150'} alt={item.title} />
                </div>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  <div className={styles.priceRow}>
                    <span className={styles.currentPrice}>₹{item.price}</span>
                    <span className={styles.oldPrice}>₹{(item.oldPrice || Math.round(item.price * 1.5))}</span>
                  </div>
                  
                  <div className={styles.controlsRow}>
                    <div className={styles.qtyBox}>
                      <button className={styles.qtyBtn} onClick={() => removeFromCart(item._id || item.id)} aria-label="Delete Item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)} aria-label="Decrease Quantity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                      <input type="text" value={item.quantity} readOnly className={styles.qtyInput} />
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)} aria-label="Increase Quantity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    </div>
                    <button className={styles.saveForLater}>Save for later</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className={styles.rightCol}>
            
            {/* Accordions */}
            <div className={styles.accordion}>
              <div className={styles.accordionHeader} onClick={() => setOpenAccordion(openAccordion === 'coupons' ? null : 'coupons')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  COUPONS & OFFERS
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openAccordion === 'coupons' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {openAccordion === 'coupons' && (
                <div className={styles.accordionBody}>
                  {coupon ? (
                    <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{coupon.code} Applied!</span>
                      </div>
                      <button onClick={() => { removeCoupon(); setCouponMessage({ text: '', type: '' }); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>REMOVE</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter Code (e.g. SAVE10)" style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', textTransform: 'uppercase' }} />
                        <button onClick={handleApplyCoupon} style={{ background: '#111', color: '#fff', padding: '0 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>APPLY</button>
                      </div>
                      {couponMessage.text && (
                        <p style={{ marginTop: '8px', fontSize: '0.85rem', color: couponMessage.type === 'success' ? '#16a34a' : '#ef4444' }}>{couponMessage.text}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.accordion}>
              <div className={styles.accordionHeader} onClick={() => setOpenAccordion(openAccordion === 'giftcard' ? null : 'giftcard')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="12" rx="2" ry="2"></rect><line x1="3" y1="14" x2="21" y2="14"></line><line x1="8" y1="8" x2="12" y2="2"></line><line x1="16" y1="8" x2="12" y2="2"></line></svg>
                  REDEEM GIFT CARD
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openAccordion === 'giftcard' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {openAccordion === 'giftcard' && (
                <div className={styles.accordionBody}>
                  Coming soon natively in next update.
                </div>
              )}
            </div>

            <h2 className={styles.summaryTitle}>ORDER SUMMARY</h2>
            
            <div className={styles.summaryRow}>
              <span>{getCartCount()} Item{getCartCount() > 1 && 's'}</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>
            
            {discountAmt > 0 && (
              <div className={styles.summaryRow} style={{ color: '#16a34a', fontWeight: '600' }}>
                <span>Coupon Discount ({coupon?.code})</span>
                <span>-₹{discountAmt.toFixed(0)}</span>
              </div>
            )}
            
            <div className={styles.summaryRow} style={{ marginBottom: '4px' }}>
              <span>Shipping Charges</span>
              <span>₹{shippingCharges}</span>
            </div>
            
            {shippingCharges > 0 && (
              <div className={styles.offerText}>
                Shop for ₹{(401 - subtotal).toFixed(0)} more and unlock free shipping
              </div>
            )}

            <div className={styles.totalRow}>
              <div className={styles.totalLabel}>
                <span className={styles.totalText}>Total Amount</span>
                <span className={styles.taxText}>(Inclusive of Taxes)</span>
              </div>
              <span className={styles.totalAmount}>₹{totalAmount.toFixed(0)}</span>
            </div>

            <button className={styles.checkoutBtn} onClick={() => { clearBuyNow(); window.location.href = '/checkout'; }}>
              CHECKOUT
            </button>

          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#111' }}>Your Shopping Bag is empty.</h2>
          <Link href="/">
            <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '14px 28px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}>Continue Shopping</button>
          </Link>
        </div>
      )}
    </div>
  );
}
