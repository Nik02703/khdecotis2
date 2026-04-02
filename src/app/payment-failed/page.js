'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Button from '@/components/ui/Button';

/**
 * /payment-failed?orderId=xxx&status=FAILED
 * 
 * Displayed when PhonePe payment fails or is cancelled.
 * Offers two options:
 *   1. "Try Again" — go back to checkout with the same cart
 *   2. "Pay via COD" — converts the failed order to Cash on Delivery
 */
function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');
  const error = searchParams.get('error');

  const handleConvertToCOD = async () => {
    if (!orderId) {
      router.push('/checkout');
      return;
    }

    try {
      // Call our API to convert the order to COD
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'COD',
          paymentStatus: 'pending',
          status: 'Pending',
          color: '#fef3c7',
          text: '#d97706',
        }),
      });

      if (res.ok) {
        router.push(`/order-success?orderId=${encodeURIComponent(orderId)}&method=cod`);
      } else {
        alert('Failed to convert to COD. Please try again.');
      }
    } catch (err) {
      console.error('[PaymentFailed] COD conversion error:', err);
      alert('Something went wrong. Please contact support.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', fontFamily: 'Outfit, sans-serif' }}>
      {/* Failure Icon */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', border: '3px solid #fca5a5',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>

      <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: '#0f172a', fontWeight: 800, textAlign: 'center' }}>
        Payment Failed
      </h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '8px', textAlign: 'center', maxWidth: '500px' }}>
        {status === 'CANCELLED'
          ? "Your payment was cancelled. Don't worry — no amount has been deducted."
          : "We couldn't process your payment. Please try again or choose Cash on Delivery."}
      </p>

      {orderId && (
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '36px' }}>
          Order Reference: <span style={{ fontWeight: 600, color: '#64748b' }}>{orderId}</span>
        </p>
      )}

      {/* Action Card */}
      <div style={{
        width: '100%', maxWidth: '480px', background: '#fff', padding: '36px',
        borderRadius: '20px', border: '1px solid #e2e8f0',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          What would you like to do?
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '28px' }}>
          Your cart items have been preserved. You can retry or switch to COD.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Retry Payment */}
          <button
            onClick={() => router.push('/checkout')}
            style={{
              width: '100%', padding: '16px', border: 'none', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6C4FE1 0%, #8B5CF6 100%)',
              color: '#fff', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 4px 15px rgba(108, 79, 225, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try Payment Again
          </button>

          {/* Convert to COD */}
          <button
            onClick={handleConvertToCOD}
            style={{
              width: '100%', padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px',
              background: '#fff', color: '#0f172a', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Pay via Cash on Delivery
          </button>

          {/* Back to shopping */}
          <Button
            onClick={() => router.push('/shop')}
            variant="outline"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '4px' }}
          >
            Continue Shopping
          </Button>
        </div>
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '20px' }}>
          Error code: {error}
        </p>
      )}
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
