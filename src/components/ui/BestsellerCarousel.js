"use client";

import { useRef, useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import styles from './BestsellerCarousel.module.css';

export default function BestsellerCarousel({ products }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Allow a 2px fractional buffer for calculation differences perfectly hiding right arrow at bounds end
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction) => {
    if (trackRef.current) {
      const scrollAmount = trackRef.current.clientWidth; // Step one container slide
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      // setTimeout maps visual translation bounds accurately
      setTimeout(checkScroll, 400); 
    }
  };

  return (
    <div className={styles.carouselWrapper}>

      
      <div 
        className={styles.carouselTrack} 
        ref={trackRef} 
        onScroll={checkScroll}
      >
        {products.map(product => (
          <div key={product._id} className={styles.carouselItem}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>


    </div>
  );
}
