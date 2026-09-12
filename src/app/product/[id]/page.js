import styles from './page.module.css';
import ProductDetailsClient from '@/components/ui/ProductDetailsClient';
import ProductReviews from '@/components/ui/ProductReviews';
import MinimalProductCarousel from '@/components/ui/MinimalProductCarousel';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import { slugify } from '@/lib/slugUtils';
import { DUMMY_PRODUCTS } from '@/lib/dummyProducts';
import { redirect } from 'next/navigation';

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams || {};

  let product = null;
  let similarProducts = [];
  let shouldRedirectToSlug = false;
  let targetSlug = null;

  try {
    await connectToDatabase();
    const cleanId = decodeURIComponent(id || '').trim();

    // 1. If valid 24-char ObjectId, find by _id first
    if (cleanId.length === 24 && /^[0-9a-fA-F]{24}$/.test(cleanId)) {
      product = await Product.findById(cleanId).lean();
      if (product) {
        // User opened page with raw MongoDB ID -> redirect to SEO product name URL!
        const friendlySlug = product.slug || slugify(product.title);
        if (friendlySlug && friendlySlug !== cleanId) {
          shouldRedirectToSlug = true;
          targetSlug = friendlySlug;
        }
      }
    }

    // 2. If not found by ObjectId, search by slug field
    if (!product) {
      product = await Product.findOne({ slug: cleanId }).lean();
    }

    // 2.5. Search by productNumber (e.g., KHD-123 or KHD-12345)
    if (!product) {
      product = await Product.findOne({
        productNumber: { $regex: new RegExp(`^${cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).lean();
    }

    // 3. Search by title regex (converting hyphens back to flexible matches)
    if (!product) {
      const words = cleanId.split('-').filter(Boolean);
      if (words.length > 0) {
        const regexPattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        product = await Product.findOne({
          title: { $regex: new RegExp(`^.*${regexPattern}.*$`, 'i') }
        }).lean();
      }
    }

    // 4. Exact slug match against all products in database
    if (!product) {
      const allProducts = await Product.find({}).lean();
      product = allProducts.find(p => 
        slugify(p.title) === cleanId || 
        (p.slug && p.slug === cleanId) || 
        (p.productNumber && slugify(p.productNumber) === cleanId) ||
        p._id?.toString() === cleanId
      );
    }

    // 5. Fallback to DUMMY_PRODUCTS if still not found
    if (!product) {
      product = DUMMY_PRODUCTS.find(p => 
        slugify(p.title) === cleanId || 
        p._id === cleanId
      );
    }

    if (product) {
      product = JSON.parse(JSON.stringify(product));

      // Fetch similar products from the same category, excluding current product
      const currentId = product._id;
      const dbSimilar = await Product.find({
        category: product.category,
        ...(currentId ? { _id: { $ne: currentId } } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      similarProducts = JSON.parse(JSON.stringify(dbSimilar));
    }
  } catch (e) {
    console.warn('[ProductPage] DB fetch error:', e.message);
  }

  // If the user accessed via raw ObjectId, redirect to friendly slug URL!
  if (shouldRedirectToSlug && targetSlug) {
    redirect(`/product/${targetSlug}`);
  }

  return (
    <div className={`animate-fade-in ${styles.page}`} style={{ background: '#fff' }}>
      {/* Primary Layout Engine */}
      <ProductDetailsClient product={product} productId={id} similarProducts={similarProducts} />

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {/* Cross-Sell References */}
        {similarProducts.length > 0 && (
          <MinimalProductCarousel title="You May Also Like" products={similarProducts.slice(0, 6)} />
        )}
        
        {/* Customer Reviews Architecture */}
        <ProductReviews />
      </div>
    </div>
  );
}
