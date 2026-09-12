'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [subMessage, setSubMessage] = useState('');

  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubStatus('error');
      setSubMessage('Please enter a valid email address.');
      return;
    }

    setSubStatus('loading');
    setSubMessage('');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubStatus('success');
        setSubMessage(data.message || 'Successfully subscribed!');
        setEmail('');
      } else {
        setSubStatus('error');
        setSubMessage(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      setSubStatus('error');
      setSubMessage('Network error. Please try again.');
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.col}>
          <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.9)', display: 'inline-block', padding: '0.5rem', borderRadius: '8px' }}>
            <img src="/logo_transparent.png" alt="KH Decotis" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} suppressHydrationWarning />
          </div>
          <p style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Elevate your home with our premium, brightly styled collections of everyday essentials and home decor.
          </p>
        </div>
        
        <div className={styles.col}>
          <h3>Shop</h3>
          <ul className={styles.linkList}>
            <li><Link href="/category/bedsheets" className={styles.link}>Bedsheets</Link></li>
            <li><Link href="/category/curtains" className={styles.link}>Curtains</Link></li>
            <li><Link href="/category/mattress" className={styles.link}>Mattress</Link></li>
            <li><Link href="/category/comforter" className={styles.link}>Comforter</Link></li>
            <li><Link href="/category/cushions" className={styles.link}>Cushions</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3>Information</h3>
          <ul className={styles.linkList}>
            <li><Link href="/about" className={styles.link}>About Us</Link></li>
            <li><Link href="/contact" className={styles.link}>Contact Us</Link></li>
            <li><Link href="/shipping" className={styles.link}>Shipping Policy</Link></li>
            <li><Link href="/returns" className={styles.link}>Returns & Refunds</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3>Newsletter</h3>
          <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>Subscribe for vibrant new arrivals and deals.</p>
          <div className={styles.newsletter}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className={styles.input} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubscribe(); }}
              disabled={subStatus === 'loading'}
            />
            <button 
              className={styles.btn} 
              onClick={handleSubscribe}
              disabled={subStatus === 'loading'}
              style={subStatus === 'loading' ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            >
              {subStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
          {subMessage && (
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.85rem', 
              fontWeight: 500,
              color: subStatus === 'success' ? '#86efac' : '#fca5a5' 
            }}>
              {subMessage}
            </p>
          )}
        </div>
      </div>
      <div className="container">
        <div className={styles.bottom}>
          &copy; {new Date().getFullYear()} KH Decotis. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
