import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.col}>
          <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.9)', display: 'inline-block', padding: '0.5rem', borderRadius: '8px' }}>
            <img src="/logo.png" alt="KH Decotis" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
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
            <input type="email" placeholder="Enter your email" className={styles.input} />
            <button className={styles.btn}>Subscribe</button>
          </div>
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
