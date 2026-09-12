/**
 * Convert any string (such as a product title) into an SEO-friendly URL slug.
 * Example: "100% Cotton Floral Bedsheet - King Size" -> "100-cotton-floral-bedsheet-king-size"
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')      // Remove special characters, symbols, punctuation
    .replace(/[\s_-]+/g, '-')      // Convert spaces, multiple hyphens, underscores to a single hyphen
    .replace(/^-+|-+$/g, '');      // Remove leading and trailing hyphens
}

/**
 * Get the clean, title-based URL for a product.
 * If title or slug is present, returns `/product/${slug}`.
 * Fallback to `/product/${id}` only if no title is available.
 */
export function getProductUrl(product) {
  if (!product) return '/shop';
  const slug = product.slug || slugify(product.title);
  if (slug) {
    return `/product/${slug}`;
  }
  return `/product/${product._id || product.id || ''}`;
}
