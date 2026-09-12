"use client";

import { useState } from 'react';
import Button from './Button';
import styles from './ShopTheLook.module.css';

const HOTSPOTS = [
  { id: '1', title: 'Ergonomic Sleep Pillows', category: 'pillows', price: 1499, description: 'Provide excellent neck support and align your spine for the perfect night\'s sleep. Crafted from hyper-responsive memory materials.', images: ['/deal_prod_pillows.jpg'], top: '50%', left: '35%' },
  { id: '2', title: 'Premium Cotton Bedsheet', category: 'bedsheets', price: 1299, description: 'Experience the ultimate comfort with our premium breathable cotton bedsheet. Exceptionally soft and cooling against your skin.', images: ['/deal_bedsheets.jpg'], top: '63%', left: '33%' },
  { id: '3', title: 'Orthopedic Memory Foam Mattress', category: 'mattress', price: 12999, description: 'Wake up pain-free on our advanced orthopedic mattress designed for optimal spine support across all weight thresholds.', images: ['/mattress%20protector.avif'], top: '72%', left: '30%' },
  { id: '4', title: 'Ultrasonic Reversible Blanket', category: 'comforter', price: 2499, description: 'Stay warm and cozy with our ultra-soft textured blanket. Lightweight warmth crafted for year-round luxury.', images: ['/Blanket.avif'], top: '67%', left: '58%' },
  { id: '5', title: 'Waterproof Mattress Protector', category: 'mattress', price: 999, description: 'Keep your pristine mattress completely safe with our breathable, 100% waterproof protector wrapper.', images: ['/mattress%20protector.avif'], top: '78%', left: '44%' }
];

export default function ShopTheLook() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const closeModal = () => setSelectedProduct(null);

  return (
    <section className={styles.sectionWrapper}>
      <h2 className={styles.sectionTitle}>Shop The Look</h2>
      
      <div className={styles.imageContainer}>
        <img 
          src="/shop_the_look.jpg" 
          alt="Luxury Purple Aesthetic Bedroom Setup" 
          className={styles.mainImage} 
        />
        
        {/* Render interactive dots mapped to X/Y coordinates over image */}
        {HOTSPOTS.map(spot => (
          <div 
            key={spot.id} 
            className={styles.hotspot} 
            style={{ top: spot.top, left: spot.left }}
            onClick={() => setSelectedProduct(spot)}
            title={spot.title}
          />
        ))}
      </div>

      {/* Fly-in drawer modal rendering conditional product context */}
      <div className={`${styles.modalOverlay} ${selectedProduct ? styles.open : ''}`} onClick={closeModal}>
        <div className={styles.modalDrawer} onClick={e => e.stopPropagation()}>
          {selectedProduct && (
            <>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Close">✕</button>
              <img src={selectedProduct.images[0]} alt={selectedProduct.title} className={styles.modalImage} />
              
              <div className={styles.modalContent}>
                <h3 className={styles.modalTitle}>{selectedProduct.title}</h3>
                <p className={styles.modalDesc}>{selectedProduct.description}</p>
                <div className={styles.modalFooter}>
                  <a href={`/category/${selectedProduct.category}`} style={{textDecoration: 'none'}}>
                    <Button variant="vibrant" fullWidth>Shop Now - ₹{selectedProduct.price}</Button>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
