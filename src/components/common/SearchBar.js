'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';
import styles from './SearchBar.module.css';
import { useProducts } from '@/context/ProductContext';
import { getProductUrl } from '@/lib/slugUtils';
import { getDisplayPrice, getOldPrice } from '@/lib/priceUtils';
import { searchProducts, parseSearchQuery } from '@/lib/searchUtils';

const SEARCH_TERMS = ['bedsheets', 'KHD-123', 'mattress', 'blankets', 'curtains'];

export default function SearchBar() {
  const router = useRouter();
  const { products } = useProducts();
  const [text, setText] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Animated placeholder typing loop — only runs when input is NOT focused and empty
  useEffect(() => {
    if (isFocused || inputVal) return;

    let i = 0;
    let isDeleting = false;
    let wordIndex = 0;
    let timer;

    function tick() {
      const currentWord = SEARCH_TERMS[wordIndex];
      
      if (isDeleting) {
        i--;
        setText(currentWord.substring(0, i));

        if (i === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % SEARCH_TERMS.length;
          timer = setTimeout(tick, 500);
        } else {
          timer = setTimeout(tick, 50);
        }
      } else {
        i++;
        setText(currentWord.substring(0, i));

        if (i === currentWord.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2000);
        } else {
          timer = setTimeout(tick, 100);
        }
      }
    }

    timer = setTimeout(tick, 400);

    return () => clearTimeout(timer);
  }, [isFocused, inputVal]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter products live by text and price
  const searchResults = useMemo(() => {
    if (!inputVal.trim()) return [];
    return searchProducts(products, inputVal.trim());
  }, [products, inputVal]);



  const handleSearch = () => {
    if (inputVal.trim()) {
      setIsOpen(false);
      setIsFocused(false);
      router.push(`/search?q=${encodeURIComponent(inputVal.trim())}`);
    }
  };

  const handleSelectProduct = () => {
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Safe image helper
  const encodeImg = (url) => {
    if (!url) return '/bedsheets.png';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url.split('/').map(p => encodeURIComponent(p)).join('/');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.searchBar}>
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (inputVal.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isFocused ? '' : `Search for ${text}|`} 
          className={styles.searchInput} 
        />
        {inputVal && (
          <button 
            type="button" 
            className={styles.clearBtn} 
            onClick={() => {
              setInputVal('');
              setIsOpen(false);
            }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <button 
          aria-label="Search Submit" 
          className={styles.searchSubmit} 
          onClick={handleSearch}
        >
          <Search size={18} />
        </button>
      </div>

      {/* Live Autocomplete Dropdown */}
      {isOpen && inputVal.trim().length > 0 && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Products</span>
          </div>

          {searchResults.length > 0 ? (
            <>
              <ul className={styles.dropdownList}>
                {searchResults.slice(0, 6).map((product) => {
                  const price = getDisplayPrice(product);
                  const oldPrice = getOldPrice(product, price);
                  const thumb = product.images?.[0] || product.image || '/bedsheets.png';
                  const url = getProductUrl(product);

                  return (
                    <li key={product._id || product.id}>
                      <Link 
                        href={url} 
                        className={styles.dropdownItem}
                        onClick={handleSelectProduct}
                      >
                        <img 
                          src={encodeImg(thumb)} 
                          alt={product.title} 
                          className={styles.itemThumb} 
                        />
                        <div className={styles.itemInfo}>
                          <h4 className={styles.itemTitle}>{product.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                            <p className={styles.itemCategory} style={{ margin: 0 }}>{product.category}</p>
                            {product.productNumber && (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                background: '#f1f5f9', 
                                color: '#475569', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                fontWeight: 600,
                                border: '1px solid #e2e8f0',
                                fontFamily: 'monospace'
                              }}>
                                {product.productNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.itemPriceCol}>
                          <span className={styles.itemPrice}>₹{price.toLocaleString('en-IN')}</span>
                          {oldPrice > price && (
                            <span className={styles.itemOldPrice}>₹{oldPrice.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.dropdownFooter}>
                <button 
                  type="button" 
                  className={styles.viewAllBtn} 
                  onClick={handleSearch}
                >
                  View all {searchResults.length} results <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noResults}>
              No products found matching &ldquo;{inputVal}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
