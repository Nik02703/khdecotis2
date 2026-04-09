'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import SearchBar from './SearchBar';
import SidebarMenu from './SidebarMenu';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { getCartCount } = useCart();
  const count = getCartCount();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const hoverTimeout = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 150);
  };

  return (
    <>
      <div className={styles.authNav}>
        <p>Free Shipping on All Orders Over ₹999</p>
      </div>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.leftGroup}>
            <SidebarMenu isProfileIcon={false} />
            {/* Sidebar menu completely removed as requested, nav actions migrating to profile dropdown */}
            <Link href="/" className={styles.logo}>
              <img src="/logo.png" alt="KH Decotis" className={styles.logoImage} />
            </Link>
          </div>

          <nav className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <div 
              className={styles.categoriesTrigger}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link href="/shop" className={styles.navLink}>Categories</Link>
            </div>
            <Link href="/about" className={styles.navLink}>About</Link>
            <Link href="/contact" className={styles.navLink}>Contact</Link>
          </nav>

          <div className={styles.icons}>
            <SearchBar />
            
            <SidebarMenu isProfileIcon={true} />

            <Link href="/cart" className={styles.iconBtn} aria-label="Cart" title="View Cart" style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              
              {count > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#e11d48', color: '#fff', fontSize: '0.7rem', fontWeight: 800, minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        
        {/* Horizontal Mega Menu Below Main Header */}
        <nav 
          className={`${styles.megaMenuBar} ${isMegaMenuOpen ? styles.megaMenuBarVisible : styles.megaMenuBarHidden}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={`container ${styles.megaMenuInner}`}>
            <div className={styles.megaMenuItem}>
              <Link href="/category/bedding" className={styles.megaMenuLink}>Bedding</Link>
              <div className={styles.megaMenuDropdown}>
                <div className={`container ${styles.megaMenuDropdownInner}`}>
                  <div className={styles.megaMenuCol}>
                    <h4>By Category</h4>
                    <Link href="/category/bedsheets">Bedsheets</Link>
                    <Link href="/category/comforter">Comforters</Link>
                    <Link href="/category/blankets">Blankets</Link>
                    <Link href="/category/mattress">Mattresses</Link>
                    <Link href="/category/pillows">Pillows</Link>
                  </div>
                  <div className={styles.megaMenuCol}>
                    <h4>Featured</h4>
                    <Link href="/shop">New Arrivals</Link>
                    <Link href="/shop">Bestsellers</Link>
                    <Link href="/shop" style={{color: '#e11d48'}}>Sale: Up to 40% Off</Link>
                  </div>
                  <div className={styles.megaMenuImageCol}>
                    <img src="/bedsheets.png" alt="Featured Bedding" style={{width: '200px', height: '140px', objectFit: 'cover'}} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.megaMenuItem}>
              <Link href="/category/doormats" className={styles.megaMenuLink}>Home Decor</Link>
              <div className={styles.megaMenuDropdown}>
                <div className={`container ${styles.megaMenuDropdownInner}`}>
                  <div className={styles.megaMenuCol}>
                    <h4>Decorative Accents</h4>
                    <Link href="/category/doormats">Door Mats</Link>
                    <Link href="/category/handtowels">Hand Towels</Link>
                  </div>
                  <div className={styles.megaMenuImageCol}>
                    <img src="/door_mat.avif" alt="Featured Decor" style={{width: '200px', height: '140px', objectFit: 'cover'}} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.megaMenuItem}>
              <Link href="/category/bath" className={styles.megaMenuLink}>Bath & Hand Towels</Link>
              <div className={styles.megaMenuDropdown}>
                <div className={`container ${styles.megaMenuDropdownInner}`}>
                  <div className={styles.megaMenuCol}>
                    <h4>Bath Essentials</h4>
                    <Link href="/category/handtowels">Hand Towels</Link>
                    <Link href="/category/doormats">Bath Mats</Link>
                  </div>
                  <div className={styles.megaMenuImageCol}>
                    <img src="/hand_towels.webp" alt="Featured Towels" style={{width: '200px', height: '140px', objectFit: 'cover'}} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.megaMenuItem}>
              <Link href="/category/curtains" className={styles.megaMenuLink}>Curtains</Link>
              <div className={styles.megaMenuDropdown}>
                <div className={`container ${styles.megaMenuDropdownInner}`}>
                  <div className={styles.megaMenuCol}>
                    <h4>Curtains & Drapes</h4>
                    <Link href="/category/curtains">Blackout Curtains</Link>
                    <Link href="/category/curtains">Sheer Curtains</Link>
                  </div>
                  <div className={styles.megaMenuImageCol}>
                    <img src="/curtains.png" alt="Featured Window" style={{width: '200px', height: '140px', objectFit: 'cover'}} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.megaMenuItem}>
              <Link href="/shop" className={styles.megaMenuLink} style={{color: '#ff4b4b'}}>ALL PRODUCTS</Link>
            </div>
          </div>
        </nav>

      </header>
    </>
  );
}
