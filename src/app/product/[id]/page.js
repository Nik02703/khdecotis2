import styles from './page.module.css';
import ProductDetailsClient from '@/components/ui/ProductDetailsClient';
import ProductReviews from '@/components/ui/ProductReviews';
import MinimalProductCarousel from '@/components/ui/MinimalProductCarousel';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams || {};

  let product = null;
  let similarProducts = [];

  try {
    await connectToDatabase();

    // Fetch the actual product from DB
    product = await Product.findById(id).lean();
    if (product) {
      product = JSON.parse(JSON.stringify(product));

      // Fetch similar products from the same category, excluding the current product
      const dbSimilar = await Product.find({
        category: product.category,
        _id: { $ne: id },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      similarProducts = JSON.parse(JSON.stringify(dbSimilar));
    }
  } catch (e) {
    console.warn('[ProductPage] DB fetch failed:', e.message);
  }

  return (
    <div className={`animate-fade-in ${styles.page}`} style={{ background: '#fff' }}>
      
      {/* Primary Layout Engine (Re-configured to exactly match specific references) */}
      <ProductDetailsClient product={product} productId={id} similarProducts={similarProducts} />

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {/* Cross-Sell References (Minimal Cards Array) */}
        {similarProducts.length > 0 && (
          <MinimalProductCarousel title="You May Also Like" products={similarProducts.slice(0, 6)} />
        )}
        
        {/* Customer Reviews Architecture (Histograms & Iterations) */}
        <ProductReviews />
      </div>

    </div>
  );
}
