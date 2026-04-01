'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isMounted } = useAuth();
  const { cartItems, getCartTotal, clearCart, buyNowItem, clearBuyNow } = useCart();
  const { addOrder } = useOrders();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postcode: '',
  });

  const [orderSuccessDetails, setOrderSuccessDetails] = useState(null);

  const activeItems = buyNowItem ? [buyNowItem] : cartItems;

  let computedTotal = 0;
  if (buyNowItem) {
    const p = typeof buyNowItem.price === 'string' ? parseFloat(buyNowItem.price.replace(/,/g, '')) : (buyNowItem.price || buyNowItem.currentPrice || 0);
    computedTotal = p * (buyNowItem.quantity || 1);
  } else {
    computedTotal = getCartTotal();
  }
  const formattedTotal = computedTotal.toLocaleString('en-IN');

  useEffect(() => {
    // Wait for hydration and verification before redirect checks
    if (isMounted) {
      if (!user) {
        router.push('/account?redirect=/checkout');
      } else {
        const savedAddress = localStorage.getItem(`khd_address_${user.email}`);
        if (savedAddress) {
          try {
            setFormData(JSON.parse(savedAddress));
          } catch(e) {}
        }
      }
    }
  }, [user, isMounted, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return; // Prevent raw bypasses

    if (!formData.firstName || !formData.lastName || !formData.address) {
      alert("Please fill out your complete shipping details.");
      return;
    }

    if (activeItems.length === 0) {
      alert("Your cart is empty! There's nothing to checkout.");
      router.push('/shop');
      return;
    }

    // Save address locally to the persistent profile cache
    localStorage.setItem(`khd_address_${user.email}`, JSON.stringify(formData));

    // Capture the submission into global persistent sync state
    const orderRecord = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: user.email,
      total: `₹${formattedTotal}`,
      items: activeItems.length,
      payload: [...activeItems],
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    addOrder(orderRecord);

    if (buyNowItem) {
      clearBuyNow();
    } else {
      clearCart();
    }

    setOrderSuccessDetails(orderRecord);
  };

  if (!isMounted || !user) {
    // Flash mitigation structure while redirect validates
    return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Authenticating securely...</div>;
  }

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
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
              <div style={{ fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>{orderSuccessDetails.email}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
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

  return (
    <div className={`container animate-fade-in ${styles.page}`}>
      <h1 className={styles.title}>Secure Checkout</h1>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.sectionTitle}>Contact Information</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address (Linked Account)</label>
          <input type="email" value={user.email} disabled className={styles.input} style={{ background: '#f1f5f9', color: '#64748b' }} />
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

        <div style={{ marginTop: '2rem' }}>
          <Button fullWidth variant="primary" type="submit">
            Complete Order (₹{formattedTotal})
          </Button>
        </div>
      </form>
    </div>
  );
}
