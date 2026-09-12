'use client';

import Link from 'next/link';
import styles from './BudgetDealsRow.module.css';
import { getProductUrl } from '@/lib/slugUtils';
import { encodeImg } from '@/lib/imageUtils';

const DEFAULT_POPULAR_DEALS = [
  {
    _id: 'deal_1',
    title: 'Trident Pure Cotton Bedsheet Set',
    images: ['/deal_prod_bedsheet.jpg'],
    price: 749,
    oldPrice: 799,
    slug: 'trident-bedsheet-set-home-100-cotton'
  },
  {
    _id: 'deal_2',
    title: 'Spaces 100% Cotton King Bedsheet',
    images: ['/bedsheets.png'],
    price: 1999,
    oldPrice: 2299,
    slug: 'spaces-100-cotton-king-bedsheet'
  },
  {
    _id: 'deal_3',
    title: 'Ultrasonic Reversible Comforter',
    images: ['/Blanket.avif'],
    price: 2499,
    oldPrice: 3999,
    slug: 'ultrasonic-reversible-comforter-queen'
  },
  {
    _id: 'deal_4',
    title: 'Premium Soft Cushions (Set of 2)',
    images: ['/cushions.avif'],
    price: 799,
    oldPrice: 1200,
    slug: 'premium-soft-cushions-set-of-2'
  }
];

export default function BudgetDealsRow({ products = [] }) {
  // Use passed products from website database or fallback to website products
  const sourceProducts = (products && products.length >= 4) ? products.slice(0, 4) : DEFAULT_POPULAR_DEALS;
  
  const dealProducts = sourceProducts.map((p) => {
    const priceNum = Number(p.price) || 649;
    const oldPriceNum = Number(p.oldPrice) || Math.round(priceNum * 1.3);
    const rawImg = p.images?.[0] || '/bedsheets.png';
    const imgUrl = encodeImg(rawImg);
    const linkUrl = getProductUrl(p);

    return {
      id: p._id || p.id || p.title,
      title: p.title,
      image: imgUrl,
      priceWhole: priceNum.toLocaleString('en-IN'),
      priceDec: '00',
      oldPrice: oldPriceNum.toLocaleString('en-IN'),
      link: linkUrl
    };
  });

  return (
    <section className={styles.section}>
      <div className="container animate-fade-in">
        {/* 4-Card Grid - Completely visible at once with no scroll buttons */}
        <div className={styles.dealsGrid}>
          
          {/* CARD 1: From ₹749 - Cotton bedsheets */}
          <Link href="/category/bedsheets" className={`${styles.dealCard} ${styles.cardBedsheets}`}>
            <img 
              src="/deal_bedsheets.jpg" 
              alt="Cotton bedsheets" 
              className={styles.cardBgImage}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/bedsheets.png';
              }}
            />
            
            <div className={styles.cardHeader}>
              <h3 className={`${styles.priceHeading} ${styles.textDark}`}>From ₹749</h3>
              <p className={`${styles.subHeading} ${styles.textDark}`}>Cotton bedsheets</p>
              <div className={`${styles.dualColTagline} ${styles.textDark}`}>
                <div className={styles.dualCol}>
                  <span>Top</span>
                  <span>brands</span>
                </div>
                <div className={styles.colDividerDark} />
                <div className={styles.dualCol}>
                  <span>Latest</span>
                  <span>trends</span>
                </div>
              </div>
            </div>

            <div className={styles.cardBottom}>
              <div className={`${styles.actionCta} ${styles.actionCtaDark}`}>
                <span>Explore Bedsheets</span>
                <span className={styles.arrowIcon}>&rarr;</span>
              </div>
            </div>
          </Link>

          {/* CARD 2: Shop popular deals (2x2 Grid with Website Products) */}
          <div className={`${styles.dealCard} ${styles.cardPopularDeals}`}>
            <div className={styles.cardHeader}>
              <h3 className={`${styles.priceHeading} ${styles.textWhite}`}>
                Shop popular<br />deals
              </h3>
            </div>

            <div className={styles.grid2x2}>
              {dealProducts.map((prod) => (
                <Link key={prod.id} href={prod.link} className={styles.gridItem}>
                  <div className={styles.gridImgWrap}>
                    <img 
                      src={prod.image} 
                      alt={prod.title} 
                      className={styles.gridItemImg} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/bedsheets.png';
                      }}
                    />
                  </div>
                  <div className={styles.gridItemPriceRow}>
                    <div className={styles.priceCurrentWrap}>
                      <span className={styles.currencySymbol}>₹</span>
                      <span className={styles.priceMain}>{prod.priceWhole}</span>
                      {prod.priceDec && <sup className={styles.priceSup}>{prod.priceDec}</sup>}
                    </div>
                    {prod.oldPrice && (
                      <span className={styles.gridItemOldPrice}>₹{prod.oldPrice}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* CARD 3: Under ₹399 - Pillows & Cushions */}
          <Link href="/category/pillows" className={`${styles.dealCard} ${styles.cardPillows}`}>
            <img 
              src="/deal_pillows.jpg" 
              alt="Pillows & Cushions" 
              className={styles.cardBgImage}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/cushions.avif';
              }}
            />
            
            <div className={styles.cardHeader}>
              <h3 className={`${styles.priceHeading} ${styles.textWhite}`}>Under ₹399</h3>
              <p className={`${styles.subHeading} ${styles.textWhite}`}>Pillows & cushions</p>
              <div className={`${styles.dualColTagline} ${styles.textWhite}`}>
                <div className={styles.dualCol}>
                  <span>Top</span>
                  <span>brands</span>
                </div>
                <div className={styles.colDividerWhite} />
                <div className={styles.dualCol}>
                  <span>Latest</span>
                  <span>trends</span>
                </div>
              </div>
            </div>

            <div className={styles.cardBottom}>
              <div className={`${styles.actionCta} ${styles.actionCtaWhite}`}>
                <span>Explore Pillows</span>
                <span className={styles.arrowIcon}>&rarr;</span>
              </div>
            </div>
          </Link>

          {/* CARD 4 (Last Box): From ₹699 - Dohars & Comforters */}
          <Link href="/category/dohars" className={`${styles.dealCard} ${styles.cardDohars}`}>
            <img 
              src="/deal_dohars.jpg" 
              alt="Dohars & Comforters" 
              className={styles.cardBgImage}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/Blanket.avif';
              }}
            />
            
            <div className={styles.cardHeader}>
              <h3 className={`${styles.priceHeading} ${styles.textWhite}`}>From ₹699</h3>
              <p className={`${styles.subHeading} ${styles.textWhite}`}>Dohars & comforters</p>
              <div className={`${styles.dualColTagline} ${styles.textWhite}`}>
                <div className={styles.dualCol}>
                  <span>Top</span>
                  <span>brands</span>
                </div>
                <div className={styles.colDividerWhite} />
                <div className={styles.dualCol}>
                  <span>Latest</span>
                  <span>trends</span>
                </div>
              </div>
            </div>

            <div className={styles.cardBottom}>
              <div className={`${styles.actionCta} ${styles.actionCtaWhite}`}>
                <span>Explore Dohars</span>
                <span className={styles.arrowIcon}>&rarr;</span>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
}
