'use client';
import { useState } from 'react';
import { encodeImg } from '@/lib/imageUtils';

export default function ProductGallery({ images, title }) {
  // Ensure we always have an array of images. If only 1 exists, we'll duplicate it for demo purposes so the gallery is visible.
  const galleryImages = images?.length > 1 ? images : [
    images?.[0] || '/bedsheets.png',
    'https://images.unsplash.com/photo-1522771731478-4eb4f9446d6f?w=800&q=80',
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80'
  ];

  const [activeImg, setActiveImg] = useState(galleryImages[0]);

  return (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', height: 'auto', alignItems: 'flex-start' }} className="product-gallery">
      {/* Thumbnails Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '80px', flexShrink: 0 }} className="thumbnails-col">
        {galleryImages.map((img, idx) => (
          <button 
            key={idx} 
            onClick={() => setActiveImg(img)}
            style={{ 
              width: '100%', 
              aspectRatio: '1/1', 
              padding: 0, 
              border: activeImg === img ? '2px solid var(--secondary)' : '1px solid var(--border)', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              cursor: 'pointer',
              background: '#f8fafc',
              transition: 'all 0.2s ease'
            }}
          >
            <img 
              src={encodeImg(img)} 
              alt={`${title} Thumbnail ${idx + 1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/bedsheets.png';
              }}
            />
          </button>
        ))}
      </div>

      {/* Main Image Stage */}
      <div style={{ flex: 1, position: 'relative', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <img 
          src={encodeImg(activeImg)} 
          alt={title} 
          style={{ width: '100%', height: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' }} 
          className="main-stage-img" 
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/bedsheets.png';
          }}
        />
        
        {/* Optional Magnifier/Zoom Hint icon */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '50%', color: '#64748b', display: 'flex', pointerEvents: 'none' }}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </div>
      </div>
      
      {/* Inline styles for mobile responsiveness */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .product-gallery {
            flex-direction: column-reverse !important;
          }
          .thumbnails-col {
            flex-direction: row !important;
            width: 100% !important;
            overflow-x: auto;
            padding-bottom: 8px;
          }
          .thumbnails-col button {
            width: 64px !important;
            flex-shrink: 0;
          }
          .main-stage-img {
            max-height: 400px !important;
          }
        }
      `}} />
    </div>
  );
}
