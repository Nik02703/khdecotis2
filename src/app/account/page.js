'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Account page — login is no longer required.
 * This page now redirects to the shop or shows a simple info page.
 */
export default function AccountPage() {
  const router = useRouter();

  return (
    <div className="container animate-fade-in" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ 
        width: '80px', height: '80px', borderRadius: '50%', 
        background: '#f0fdf4', border: '2px solid #bbf7d0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', textAlign: 'center' }}>
        No Login Required!
      </h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '480px', textAlign: 'center', lineHeight: 1.7, marginBottom: '36px' }}>
        You can shop, checkout, and track your orders without creating an account. Just fill in your details during checkout.
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/shop">
          <button style={{ 
            padding: '14px 32px', background: '#0f172a', color: '#fff', 
            border: 'none', borderRadius: '10px', fontWeight: 700, 
            fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'transform 0.2s',
          }}>
            Browse Shop
          </button>
        </Link>
        <Link href="/orders">
          <button style={{ 
            padding: '14px 32px', background: '#fff', color: '#0f172a', 
            border: '2px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, 
            fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'transform 0.2s',
          }}>
            Track Orders
          </button>
        </Link>
      </div>
    </div>
  );
}
