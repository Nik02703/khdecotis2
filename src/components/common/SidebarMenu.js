'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import styles from './SidebarMenu.module.css';

export default function SidebarMenu({ isProfileIcon = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuContent = (
    <>
      <div className={styles.overlay} onClick={() => setIsOpen(false)}></div>
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          {isProfileIcon ? (
            <div className={styles.accountInfo}>
              <div className={styles.avatarIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div className={styles.accountText}>
                <span className={styles.accountTitle}>My Account</span>
                <span className={styles.accountLogin} style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Guest Checkout</span>
              </div>
            </div>
          ) : (
            <Link href="/" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="KH Decotis Logo" style={{ height: '32px', objectFit: 'contain' }} />
            </Link>
          )}
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className={styles.drawerBody}>
          {isProfileIcon ? (
            <>
              <div className={styles.quickLinksGrid}>
                <Link href="/cart" className={styles.quickLinkCard} onClick={() => setIsOpen(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  <span>My Cart</span>
                </Link>

                <Link href="/orders" className={styles.quickLinkCard} onClick={() => setIsOpen(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>My Orders</span>
                </Link>
              </div>

              <nav className={styles.drawerNav}>
                <Link href="/shop" className={styles.drawerNavItem} onClick={() => setIsOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  Browse Categories
                </Link>
                
                <Link href="/shop" className={styles.drawerNavItem} onClick={() => setIsOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
                  Offers
                </Link>

                <div className={styles.divider}></div>

                <Link href="/wishlist" className={styles.drawerNavItem} onClick={() => setIsOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  Wishlist
                </Link>

                <Link href="/contact" className={styles.drawerNavItem} onClick={() => setIsOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Contact Us
                </Link>
                
                <Link href="/about" className={styles.drawerNavItem} onClick={() => setIsOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                  Feedback
                </Link>
              </nav>
            </>
          ) : (
            <div style={{ fontFamily: 'Playfair Display, serif' }}>
              <Link href="/" onClick={() => setIsOpen(false)} style={{ display: 'block', fontSize: '1.25rem', fontWeight: 500, color: '#333', padding: '12px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                Home
              </Link>
              
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 500, color: '#333', marginBottom: '12px' }}>Categories</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px', fontFamily: 'Inter, sans-serif' }}>
                  <Link href="/category/bedding" onClick={() => setIsOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>Bedding</Link>
                  <Link href="/category/decor" onClick={() => setIsOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>Cushions & Pillows</Link>
                  <Link href="/category/bath" onClick={() => setIsOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>Bath</Link>
                  <Link href="/category/curtains" onClick={() => setIsOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>Curtains</Link>
                </div>
              </div>

              <Link href="/shop" onClick={() => setIsOpen(false)} style={{ display: 'block', fontSize: '1.25rem', fontWeight: 500, color: '#e11d48', padding: '12px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                Up To 40% Off Sale
              </Link>
              
              <Link href="/about" onClick={() => setIsOpen(false)} style={{ display: 'block', fontSize: '1.25rem', fontWeight: 500, color: '#333', padding: '12px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                About Us
              </Link>

              <Link href="/contact" onClick={() => setIsOpen(false)} style={{ display: 'block', fontSize: '1.25rem', fontWeight: 500, color: '#333', padding: '12px 0', textDecoration: 'none' }}>
                Contact
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button 
        className={isProfileIcon ? "profileToggleBtn" : styles.hamburgerBtn} 
        style={isProfileIcon ? { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', color: 'var(--primary)', transition: 'color 0.2s ease, transform 0.2s ease' } : {}}
        onClick={() => setIsOpen(true)}
        aria-label={isProfileIcon ? "Account Menu" : "Open Menu"}
      >
        {isProfileIcon ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        ) : (
          <svg fill="none" width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {mounted && isOpen && createPortal(menuContent, document.body)}
    </>
  );
}
