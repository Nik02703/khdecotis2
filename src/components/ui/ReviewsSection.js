'use client';
import { useState, useEffect } from 'react';
import styles from './ReviewsSection.module.css';

const REVIEWS = [
  {
    id: 1,
    quote: "KH Decotis bedsheets have made bedtime so soft and",
    highlight: "luxurious.",
    author: "PRIYA S.",
    location: "Bangalore",
  },
  {
    id: 2,
    quote: "The blackout velvet curtains completely transformed my living room with gorgeous",
    highlight: "textures.",
    author: "RAHUL M.",
    location: "Mumbai",
  },
  {
    id: 3,
    quote: "This comforter gives you the exact same feeling as sleeping in a 5-star",
    highlight: "hotel.",
    author: "ANITA K.",
    location: "Delhi",
  },
  {
    id: 4,
    quote: "The fabric is exceptionally soft and breathable. KH Decotis pays attention to every",
    highlight: "detail.",
    author: "SNEHA V.",
    location: "Hyderabad",
  },
  {
    id: 5,
    quote: "Outstanding customer service and the plush cushions are simply",
    highlight: "stunning.",
    author: "VIKRAM R.",
    location: "Pune",
  }
];

export default function ReviewsSection() {
  const [state, setState] = useState({ index: 0, animating: false });

  const current = REVIEWS[state.index];

  const handleNext = () => {
    if (state.animating) return;
    setState(s => ({ animating: true, index: (s.index + 1) % REVIEWS.length }));
  };

  const handlePrev = () => {
    if (state.animating) return;
    setState(s => ({ animating: true, index: (s.index - 1 + REVIEWS.length) % REVIEWS.length }));
  };

  const handleDotClick = (idx) => {
    if (state.animating || idx === state.index) return;
    setState({ animating: true, index: idx });
  };

  useEffect(() => {
    const timer = setTimeout(() => setState(s => ({ ...s, animating: false })), 400);
    return () => clearTimeout(timer);
  }, [state.index]);

  useEffect(() => {
    const autoPlay = setInterval(() => {
      setState(s => ({ animating: false, index: (s.index + 1) % REVIEWS.length }));
    }, 6000);
    return () => clearInterval(autoPlay);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.bannerContainer}>

        {/* Static Background Image — reviews.webp */}
        <img
          src="/reviews.webp"
          alt="Customer Reviews Background"
          className={styles.bgImage}
        />

        {/* Left gradient scrim so text stays readable */}
        <div className={styles.scrim} />

        {/* Foreground Content */}
        <div className={styles.content}>

          <div className={styles.quoteIcon}>
            <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 24V14C0 9.8 1.2 6.2 3.5 3.3C5.8 0.3 9.1-0.8 13.5 0.3L12 4.1C9.7 3.5 7.8 4.2 6.2 6.2C4.6 8.2 3.8 10.4 3.8 12.8H12V24H0ZM16 24V14C16 9.8 17.2 6.2 19.5 3.3C21.8 0.3 25.1-0.8 29.5 0.3L28 4.1C25.7 3.5 23.8 4.2 22.2 6.2C20.6 8.2 19.8 10.4 19.8 12.8H28V24H16Z" fill="#b45309"/>
            </svg>
          </div>

          <div className={`${styles.quoteBlock} ${state.animating ? styles.fadeOut : ''}`}>
            <h2 className={styles.quoteText}>
              {current.quote}{' '}
              <span className={styles.highlight}>{current.highlight}</span>
            </h2>
          </div>

          <div className={styles.controls}>
            <button className={styles.navBtn} onClick={handlePrev} aria-label="Previous">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            <div className={`${styles.authorBlock} ${state.animating ? styles.fadeOut : ''}`}>
              <span className={styles.authorName}>{current.author}</span>
              <span className={styles.authorLocation}>{current.location}</span>
            </div>

            <div className={styles.dots}>
              {REVIEWS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`${styles.dot} ${idx === state.index ? styles.activeDot : ''}`}
                  aria-label={`Review ${idx + 1}`}
                />
              ))}
            </div>

            <button className={styles.navBtn} onClick={handleNext} aria-label="Next">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
