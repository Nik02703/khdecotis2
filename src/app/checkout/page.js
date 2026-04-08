'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, getCartSubtotal, getDiscountAmount, coupon, clearCart, buyNowItem, clearBuyNow } = useCart();
  const { addOrder } = useOrders();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    phone: '',
  });

  const [orderSuccessDetails, setOrderSuccessDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'

  const activeItems = buyNowItem ? [buyNowItem] : cartItems;

  // Calculate pricing with coupon discount & shipping
  let subtotal = 0;
  let discountAmt = 0;
  if (buyNowItem) {
    const p = typeof buyNowItem.price === 'string' ? parseFloat(buyNowItem.price.replace(/,/g, '')) : (buyNowItem.price || buyNowItem.currentPrice || 0);
    subtotal = p * (buyNowItem.quantity || 1);
    // No coupon for buy-now items
    discountAmt = 0;
  } else {
    subtotal = getCartSubtotal();
    discountAmt = getDiscountAmount();
  }
  const discountedSubtotal = subtotal - discountAmt;
  const shippingCharges = discountedSubtotal > 400 ? 0 : 79;
  const computedTotal = discountedSubtotal + shippingCharges;
  const formattedTotal = computedTotal.toLocaleString('en-IN');

  useEffect(() => {
    // Restore saved address from localStorage (keyed by email if available)
    const savedAddress = localStorage.getItem('khd_guest_address');
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch(e) {}
    }
  }, []);

  /**
   * Validate the shipping form before any payment action
   */
  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address) {
      alert("Please fill out your complete details including email and shipping address.");
      return false;
    }
    if (!formData.city || !formData.state || !formData.postcode || !formData.phone) {
      alert("Please fill all address fields including city, state, postcode, and phone.");
      return false;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (activeItems.length === 0) {
      alert("Your cart is empty! There's nothing to checkout.");
      router.push('/shop');
      return false;
    }
    return true;
  };

  /**
   * Build the order record common to both COD and online payment
   */
  const buildOrderRecord = () => ({
    name: `${formData.firstName} ${formData.lastName}`,
    email: formData.email,
    total: `₹${formattedTotal}`,
    items: activeItems.length,
    payload: [...activeItems],
    date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  });

  /**
   * Handle Cash on Delivery — same as the original flow
   */
  const handleCODSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Save address locally for future convenience
    localStorage.setItem('khd_guest_address', JSON.stringify(formData));

    const orderRecord = buildOrderRecord();
    addOrder(orderRecord, formData, 'COD');

    if (buyNowItem) {
      clearBuyNow();
    } else {
      clearCart();
    }

    setOrderSuccessDetails(orderRecord);
  };

  /**
   * Handle Pay Now (Razorpay Online Payment)
   * 1. Save order to MongoDB (paymentStatus: pending)
   * 2. Call /api/payment/razorpay/create-order to get Razorpay token
   * 3. Open Razorpay modal
   * 4. Call /api/payment/razorpay/verify on success
   */
  const handleOnlinePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isProcessing) return;

    if (typeof window === 'undefined' || !window.Razorpay) {
      alert("Payment gateway is still loading. Please wait a second and try again.");
      return;
    }

    setIsProcessing(true);
    console.log('[Checkout DEBUG] ══════════════════════════════════════');
    console.log('[Checkout DEBUG] RAZORPAY ONLINE clicked');
    console.log('[Checkout DEBUG] ══════════════════════════════════════');

    try {
      // Save address locally
      localStorage.setItem('khd_guest_address', JSON.stringify(formData));

      // Step 1: Create order
      const orderRecord = buildOrderRecord();
      const orderId = addOrder(orderRecord, formData, 'Razorpay');

      // Small delay to let MongoDB save complete before initiating payment
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Call payment initiation API
      const requestBody = {
        orderId: orderId,
        amount: computedTotal,
        userPhone: formData.phone,
        userEmail: formData.email,
        userName: `${formData.firstName} ${formData.lastName}`,
      };
      
      const response = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success && data.razorpayOrderId) {
        console.log('[Checkout DEBUG] ✅ Received Razorpay Order ID:', data.razorpayOrderId);
        
        // Step 3: Configure Razorpay Options
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Sai5kTFBnTQsnu', 
          amount: data.amount, // completely driven by strict backend computation
          currency: data.currency,
          name: "KH Decotis",
          description: "Premium Home Decor Purchase",
          order_id: data.razorpayOrderId,
          handler: async function (response) {
             console.log('[Razorpay] ✅ Payment Captured on Frontend, verifying signature...');
             // Do NOT clear cart yet
             
             // Step 4: Verify Signature with Backend
             const verifyRes = await fetch('/api/payment/razorpay/verify', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 razorpay_order_id: response.razorpay_order_id,
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_signature: response.razorpay_signature
               })
             });
             
             const verifyData = await verifyRes.json();
             
             if (verifyData.success) {
               console.log('[Razorpay] ✅ Signature Verified! Redirecting to success screen.');
               router.push(`/order-success?orderId=${encodeURIComponent(orderId)}`);
             } else {
               alert("Payment verification failed. Please contact support.");
               setIsProcessing(false);
             }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: "#111111" // Sleek dark aesthetic
          }
        };

        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response){
           console.error('[Razorpay] ❌ Payment Failed:', response.error);
           alert(`Payment Failed: ${response.error.description}`);
           setIsProcessing(false);
        });

        rzp.open();

      } else {
        console.error('[Checkout DEBUG] ❌ FAILED — no Razorpay order token:', data.error);
        alert(data.error || 'Failed to initiate Razorpay payment. Please try again or use Cash on Delivery.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('[Checkout DEBUG] ❌ EXCEPTION:', error.message);
      alert('Something went wrong. Please try again or choose Cash on Delivery.');
      setIsProcessing(false);
    }
  };

  /**
   * Common form submission handler — routes to COD or online based on selection
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'cod') {
      handleCODSubmit(e);
    } else {
      handleOnlinePayment(e);
    }
  };

  // ──── COD Order Success View (inline) ────
  if (orderSuccessDetails) {
    return (
      <div className={`container animate-fade-in ${styles.page}`} style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
        <div style={{ background: '#f0fdf4', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #bbf7d0' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px', color: '#0f172a', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Order Successfully Placed</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>Thank you for shopping, {orderSuccessDetails.name}.</p>
        
        <div style={{ width: '100%', maxWidth: '540px', background: '#fff', padding: '36px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', fontWeight: 700, color: '#0f172a' }}>Order Details</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{orderSuccessDetails.date}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>Cash on Delivery</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
              <div style={{ fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>{orderSuccessDetails.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>{orderSuccessDetails.total}</div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', margin: '36px 0 16px', fontWeight: 700, color: '#0f172a' }}>Items ({orderSuccessDetails.items})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
            {orderSuccessDetails.payload.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: idx === orderSuccessDetails.payload.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={item.images?.[0] || item.image || '/placeholder.png'} alt={item.title} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Qty: {item.quantity} × <span style={{ color: '#0f172a' }}>₹{Number(item.price || 0).toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{(Number(item.price || 0) * item.quantity).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'stretch' }}>
            <div style={{ flex: 1 }}>
              <Button onClick={() => router.push('/orders')} variant="primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
                View Orders
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <Button onClick={() => router.push('/shop')} variant="outline" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──── Main Checkout Form ────
  return (
    <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    <div className={`container animate-fade-in ${styles.page}`}>
      <h1 className={styles.title}>Secure Checkout</h1>

      {/* ──── Order Summary Panel ──── */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px',
        padding: '24px', marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>Order Summary</h2>
        
        {/* Items preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          {activeItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={item.images?.[0] || item.image || '/placeholder.png'} alt={item.title} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {item.quantity || 1}</div>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569' }}>
            <span>Subtotal ({activeItems.reduce((s, i) => s + (i.quantity || 1), 0)} items)</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          {discountAmt > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#16a34a', fontWeight: 600 }}>
              <span>Coupon Discount ({coupon?.code})</span>
              <span>−₹{discountAmt.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569' }}>
            <span>Shipping</span>
            <span style={{ color: shippingCharges === 0 ? '#16a34a' : '#475569', fontWeight: shippingCharges === 0 ? 600 : 400 }}>
              {shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', paddingTop: '14px', borderTop: '2px solid #e2e8f0', marginTop: '6px' }}>
            <span>Total</span>
            <span>₹{formattedTotal}</span>
          </div>
        </div>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.sectionTitle}>Contact Information</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <input type="email" className={styles.input} required placeholder="your@email.com" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
        </div>
        
        <h2 className={styles.sectionTitle}>Shipping Address</h2>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>First Name</label>
            <input type="text" className={styles.input} required value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Last Name</label>
            <input type="text" className={styles.input} required value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Address</label>
          <input type="text" className={styles.input} required placeholder="Street address, P.O. box, etc." value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} />
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>City</label>
            <input type="text" className={styles.input} required value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Postcode (6 Digits)</label>
            <input type="text" className={styles.input} required maxLength="6" pattern="\d{6}" title="Please enter a valid 6-digit postcode" value={formData.postcode} onChange={e=>{ const val = e.target.value.replace(/\D/g, ''); setFormData({...formData, postcode: val}); }} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>State</label>
            <input type="text" className={styles.input} required placeholder="e.g. Gujarat" value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <input type="tel" className={styles.input} required maxLength="10" pattern="\d{10}" title="Please enter a valid 10-digit phone number" placeholder="10-digit mobile number" value={formData.phone} onChange={e=>{ const val = e.target.value.replace(/\D/g, ''); setFormData({...formData, phone: val}); }} />
          </div>
        </div>

        {/* ──── Payment Method Selection ──── */}
        <h2 className={styles.sectionTitle}>Payment Method</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
          {/* Pay Online (PhonePe) */}
          <label
            onClick={() => setPaymentMethod('online')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '18px 20px', borderRadius: '12px', cursor: 'pointer',
              border: paymentMethod === 'online' ? '2px solid #6C4FE1' : '2px solid #e2e8f0',
              background: paymentMethod === 'online' ? '#f5f3ff' : '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              border: paymentMethod === 'online' ? '6px solid #6C4FE1' : '2px solid #cbd5e1',
              transition: 'all 0.2s',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '2px' }}>Pay Online</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>UPI, Debit/Credit Card, Net Banking via Razorpay</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #6C4FE1 0%, #8B5CF6 100%)',
              color: '#fff', padding: '4px 14px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em',
            }}>
              RECOMMENDED
            </div>
          </label>

          {/* Cash on Delivery */}
          <label
            onClick={() => setPaymentMethod('cod')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '18px 20px', borderRadius: '12px', cursor: 'pointer',
              border: paymentMethod === 'cod' ? '2px solid #6C4FE1' : '2px solid #e2e8f0',
              background: paymentMethod === 'cod' ? '#f5f3ff' : '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              border: paymentMethod === 'cod' ? '6px solid #6C4FE1' : '2px solid #cbd5e1',
              transition: 'all 0.2s',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '2px' }}>Cash on Delivery</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Pay when your order arrives at your doorstep</div>
            </div>
          </label>
        </div>

        {/* ──── Submit Buttons ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paymentMethod === 'online' ? (
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: '12px',
                background: isProcessing
                  ? '#a5b4fc'
                  : 'linear-gradient(135deg, #6C4FE1 0%, #8B5CF6 50%, #A78BFA 100%)',
                color: '#fff', fontSize: '1.05rem', fontWeight: 700,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif', letterSpacing: '0.02em',
                transition: 'all 0.3s ease',
                boxShadow: isProcessing ? 'none' : '0 4px 15px rgba(108, 79, 225, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              {isProcessing ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="42" strokeDashoffset="12" strokeLinecap="round" />
                  </svg>
                  Processing Payment...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Pay ₹{formattedTotal} Securely
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: '12px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fff', fontSize: '1.05rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                letterSpacing: '0.02em', transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(15, 23, 42, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              Place COD Order — ₹{formattedTotal}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '16px', lineHeight: 1.6 }}>
          🔒 Your payment is processed securely via Razorpay. We never store your card details.
        </p>
      </form>

      {/* Spinner animation keyframe */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
    </>
  );
}
