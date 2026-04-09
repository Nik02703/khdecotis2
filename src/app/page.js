import styles from './page.module.css';
import Button from '@/components/ui/Button';
import BestsellerCarousel from '@/components/ui/BestsellerCarousel';
import ShopTheLook from '@/components/ui/ShopTheLook';
import ReviewsSection from '@/components/ui/ReviewsSection';
import PromoBento from '@/components/ui/PromoBento';
import DealOfTheDay from '@/components/ui/DealOfTheDay';
import LightningBanner from '@/components/ui/LightningBanner';
import NewArrivals from '@/components/ui/NewArrivals';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyProducts';

export default async function Home() {
  // Fetch bestseller products from DB
  let bestsellerProducts = DUMMY_PRODUCTS; // fallback
  try {
    await connectToDatabase();
    const dbBestsellers = await Product.find({ isBestseller: true }).sort({ createdAt: -1 }).lean();
    if (dbBestsellers && dbBestsellers.length > 0) {
      bestsellerProducts = JSON.parse(JSON.stringify(dbBestsellers));
    }
  } catch (e) {
    console.warn('[Home] Bestsellers DB fetch failed, using fallback');
  }

  return (
    <>
      <section className={styles.hero}>
        <video 
          className={styles.heroVideo} 
          src="/home.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
        />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <img src="/logo1_transparent.png" alt="KH Decotis Logo" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>The Art of Living</h1>
          <p className={styles.heroSubtitle}>
            Curated premium essentials designed to bring comfort, elegance, and unrivaled quality to your sanctuary.
          </p>
          <Button href="/shop" variant="secondary" className={styles.ctaBtn}>
            Explore Collection
          </Button>
        </div>
      </section>

      <section className={`container ${styles.section} animate-fade-in`}>
        <h2 className={styles.sectionTitle}>Shop by Category</h2>
        <div className={styles.categoryGrid}>
          <a href="/category/bedsheets" className={styles.categoryCard}>
            <img src="/bedsheets.png" alt="Bedsheets" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Bedsheets</h3>
          </a>
          <a href="/category/curtains" className={styles.categoryCard}>
            <img src="/curtains.png" alt="Curtains" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Curtains</h3>
          </a>
          <a href="/category/mattress" className={styles.categoryCard}>
            <img src="/mattress%20protector.avif" alt="Mattress Protector" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Mattress</h3>
          </a>
          <a href="/category/comforter" className={styles.categoryCard}>
            <img src="/Blanket.avif" alt="Comforter" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Comforter</h3>
          </a>
          <a href="/category/blankets" className={styles.categoryCard}>
            <img src="/Blanket.avif" alt="Blankets" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Blankets</h3>
          </a>
          <a href="/category/pillows" className={styles.categoryCard}>
            <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80" alt="Pillows" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Pillows</h3>
          </a>
          <a href="/category/doormats" className={styles.categoryCard}>
            <img src="/door_mat.avif" alt="Door Mats" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Door Mats</h3>
          </a>
          <a href="/category/handtowels" className={styles.categoryCard}>
            <img src="/hand_towels.webp" alt="Hand Towels" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Hand Towels</h3>
          </a>

        </div>
      </section>



      {/* Deal Of The Day Active Countdown */}
      <DealOfTheDay />

      {/* 3D Typography "New Arrivals" block with Filtering Layouts */}
      <NewArrivals />

      {/* 5-Card Grid Bento Box Discounts */}
      <PromoBento />

      {/* Interactive Shop The Look Feature */}
      <ShopTheLook />

      {/* Full-width Promotional Banner */}
      <section className={styles.promoBanner}>
        <img src="/bedsheets.png" alt="Bedsheets Exclusive Sale" className={styles.promoBg} />
        <div className={styles.promoContent}>
          <h2 className={styles.promoTitle}>65% OFF</h2>
          <p className={styles.promoSubtitle}>On Premium Luxury Bedsheets</p>
          <a href="/category/bedsheets">
            <Button variant="vibrant">Shop The Sale</Button>
          </a>
        </div>
      </section>

      <section className={`container ${styles.section} animate-fade-in`}>
        <h2 className={styles.sectionTitle}>Bestsellers</h2>
        <BestsellerCarousel products={bestsellerProducts} />
      </section>

      {/* Global Animated Customer Feedback Ribbon */}
      <ReviewsSection />
    </>
  );
}
