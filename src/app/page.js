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

export const DUMMY_PRODUCTS = [
  { _id: '1', title: 'Premium Cotton Bedsheet - Floral', price: 1299, category: 'bedsheets', description: 'Experience the ultimate comfort with our premium floral cotton bedsheet. Highly breathable and exceptionally soft.', images: ['/bedsheets.png'] },
  { _id: '2', title: 'Blackout Velvet Curtains - Set of 2', price: 1999, category: 'curtains', description: 'Block out light entirely and reduce noise with these luxurious velvet curtains.', images: ['/curtains.png'] },
  { _id: '3', title: 'Orthopedic Memory Foam Mattress', price: 12999, category: 'mattress', description: 'Wake up pain-free on our advanced orthopedic mattress designed for optimal spine support.', images: ['/mattress%20protector.avif'] },
  { _id: '4', title: 'Ultrasonic Reversible Comforter - Queen', price: 2499, category: 'comforter', description: 'Stay warm and cozy. Featuring reversible designs mapping to your room\'s decor.', images: ['/Blanket.avif'] },
  { _id: '5', title: 'Luxury Decorative Cushions', price: 899, category: 'cushions', description: 'Add a pop of elegance to your sofa with these beautifully crafted cushions.', images: ['/cushions.avif'] },
  { _id: '6', title: 'Premium Anti-Slip Door Mat', price: 499, category: 'doormats', description: 'Keep your entryways clean and stylish with our durable, anti-slip door mat.', images: ['/door_mat.avif'] },
  { _id: '7', title: 'Ultra-Soft Hand Towels - Set of 4', price: 699, category: 'handtowels', description: 'Highly absorbent and plush hand towels perfect for your guest bathroom.', images: ['/hand_towels.webp'] },
  { _id: '8', title: 'Ergonomic Sleep Pillows - Set of 2', price: 1499, category: 'pillows', description: 'Provide excellent neck support and align your spine for the perfect night\'s sleep.', images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1000&q=80'] },
];

export default async function Home() {
  // Fetch bestseller products from DB
  let bestsellerProducts = DUMMY_PRODUCTS; // fallback
  try {
    await connectToDatabase();
    const dbBestsellers = await Product.find({ isBestseller: true }).sort({ createdAt: -1 }).lean();
    if (dbBestsellers && dbBestsellers.length > 0) {
      bestsellerProducts = dbBestsellers.map(p => ({ ...p, _id: p._id.toString() }));
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
          <a href="/category/cushions" className={styles.categoryCard}>
            <img src="/cushions.avif" alt="Cushions" className={styles.categoryImg} />
            <h3 className={styles.categoryTitle}>Cushions</h3>
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
