'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Button from '@/components/ui/Button';

/**
 * /order-success?orderId=xxx&txnId=xxx
 * 
 * Displayed after a successful PhonePe payment.
 * Fetches the order details from MongoDB and shows confirmation.
 * If paymentStatus is still "pending" after 5 seconds, shows a
 * "verification in progress" message — the webhook will catch up.
 */
function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const txnId = searchParams.get('txnId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);

          // If payment is still pending after fetch, start a verification timer
          if (data.paymentStatus !== 'paid') {
            setVerifying(true);
            // Re-check after 5 seconds
            setTimeout(async () => {
              try {
                const recheck = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
                if (recheck.ok) {
                  const updated = await recheck.json();
                  setOrder(updated);
                  if (updated.paymentStatus === 'paid') {
                    setVerifying(false);
                  }
                }
              } catch(e) {}
            }, 5000);
          }
        }
      } catch (err) {
        console.error('[OrderSuccess] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#6C4FE1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', fontFamily: 'Outfit, sans-serif' }}>
      {/* Success Icon */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', border: '3px solid #86efac',
        animation: 'bounceIn 0.5s ease-out',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: '#0f172a', fontWeight: 800, textAlign: 'center' }}>
        Payment Successful!
      </h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '12px', textAlign: 'center' }}>
        Your order has been confirmed and is being processed.
      </p>

      {verifying && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px',
          padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ color: '#92400e', fontSize: '0.9rem', fontWeight: 500 }}>Payment verification in progress...</span>
        </div>
      )}

      {/* Order Details Card */}
      <div style={{
        width: '100%', maxWidth: '540px', background: '#fff', padding: '36px',
        borderRadius: '20px', border: '1px solid #e2e8f0',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)', textAlign: 'left',
      }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', fontWeight: 700, color: '#0f172a' }}>
          Order Summary
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Order ID</div>
            <div style={{ fontWeight: 700, color: '#6C4FE1', fontSize: '1.05rem' }}>{orderId || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Payment Method</div>
            <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: 'linear-gradient(135deg, #6C4FE1, #8B5CF6)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>PhonePe</span>
            </div>
          </div>
          {order && (
            <>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Customer</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Amount Paid</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.2rem' }}>{order.totalString || `₹${order.totalAmount || 0}`}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Date</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.dateString || new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    background: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                    color: order.paymentStatus === 'paid' ? '#16a34a' : '#d97706',
                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700,
                  }}>
                    {order.paymentStatus === 'paid' ? '✓ PAID' : 'VERIFYING...'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Order Items */}
        {order?.payload && order.payload.length > 0 && (
          <>
            <h3 style={{ fontSize: '1rem', margin: '28px 0 12px', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              Items ({order.items || order.payload.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {order.payload.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0', borderBottom: idx < order.payload.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <img
                    src={item.images?.[0] || item.image || '/placeholder.png'}
                    alt={item.title || 'Product'}
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {item.quantity || 1}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {txnId && (
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Transaction ID: </span>
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500, wordBreak: 'break-all' }}>{txnId}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <Button onClick={() => router.push('/orders')} variant="primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
              My Orders
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button onClick={() => router.push('/shop')} variant="outline" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
