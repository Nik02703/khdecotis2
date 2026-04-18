import Link from 'next/link';
import styles from '@/app/page.module.css';

export default function CategoriesPage() {
  return (
    <div className={`container ${styles.section} animate-fade-in`} style={{ minHeight: '80vh', paddingTop: '4rem' }}>
      <header className="page-header">
        <h1 className="page-title">Master Collections</h1>
        <p className="page-subtitle">Select a category to explore highly curated sub-divisions mapping to our premium collections.</p>
      </header>

      <div className={styles.categoryGrid}>
        <Link href="/category/bedsheets" className={styles.categoryCard}>
          <img src="/bedsheets.png" alt="Bedsheets" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Bedsheets</h3>
        </Link>
        <Link href="/category/comforter" className={styles.categoryCard}>
          <img src="/Blanket.avif" alt="Comforter" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Comforter</h3>
        </Link>
        <Link href="/category/blankets" className={styles.categoryCard}>
          <img src="/blankets.png" alt="Blankets" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Blankets</h3>
        </Link>
        <Link href="/category/dohars" className={styles.categoryCard}>
          <img src="/dohars.jpg" alt="Dohars" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Dohars</h3>
        </Link>
        <Link href="/category/cushion-covers" className={styles.categoryCard}>
          <img src="/cushions.avif" alt="Cushion Covers" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Cushion Covers</h3>
        </Link>
        <Link href="/category/sofa-covers" className={styles.categoryCard}>
          <img src="/sofa_covers.png" alt="Sofa Covers" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Sofa Covers</h3>
        </Link>
        <Link href="/category/carpets" className={styles.categoryCard}>
          <img src="/door_mat.avif" alt="Carpets" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Carpets</h3>
        </Link>
        <Link href="/category/runners" className={styles.categoryCard}>
          <img src="/runners.png" alt="Runners" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Runners</h3>
        </Link>
        <Link href="/category/curtains" className={styles.categoryCard}>
          <img src="/curtains.png" alt="Curtains" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Curtains</h3>
        </Link>
        <Link href="/category/roller-curtains" className={styles.categoryCard}>
          <img src="/roller_curtains.png" alt="Roller Curtains" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Roller Curtains</h3>
        </Link>
        <Link href="/category/zebra-curtains" className={styles.categoryCard}>
          <img src="/zebra_curtains.png" alt="Zebra Curtains" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Zebra Curtains</h3>
        </Link>
        <Link href="/category/mosquito-net" className={styles.categoryCard}>
          <img src="/mosquito_net.png" alt="Mosquito Net" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Mosquito Net</h3>
        </Link>
        <Link href="/category/mattress" className={styles.categoryCard}>
          <img src="/mattress%20protector.avif" alt="Mattress" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Mattress</h3>
        </Link>
        <Link href="/category/cushions" className={styles.categoryCard}>
          <img src="/cushions.avif" alt="Cushions" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Cushions</h3>
        </Link>
        <Link href="/category/pillows" className={styles.categoryCard}>
          <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80" alt="Pillows" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Pillows</h3>
        </Link>
        <Link href="/category/doormats" className={styles.categoryCard}>
          <img src="/door_mat.avif" alt="Door Mats" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Door Mats</h3>
        </Link>
        <Link href="/category/handtowels" className={styles.categoryCard}>
          <img src="/hand_towels.webp" alt="Hand Towels" className={styles.categoryImg} />
          <h3 className={styles.categoryTitle}>Hand Towels</h3>
        </Link>
      </div>
    </div>
  );
}
