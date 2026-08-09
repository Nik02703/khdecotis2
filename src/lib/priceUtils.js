/**
 * Centralized Price & MRP Calculation Utilities
 * Ensures consistent pricing, strikethrough MRP, and discount calculations across all components.
 */

export function parseNum(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? fallback : num;
}

export function getDefaultSizeName(product) {
  if (!product) return '';
  const sizes = product.sizes || [];
  const variants = product.variants || [];

  const basePrice = parseNum(product.price);

  if (sizes.length > 0) {
    if (basePrice > 0) {
      const matchingSize = sizes.find(s => parseNum(s.price) === basePrice);
      if (matchingSize) return matchingSize.name;

      const matchingVariant = variants.find(v => parseNum(v.price) === basePrice);
      if (matchingVariant && matchingVariant.size) return matchingVariant.size;
    }
    return sizes[0]?.name || '';
  }

  if (variants.length > 0) {
    if (basePrice > 0) {
      const matchingVariant = variants.find(v => parseNum(v.price) === basePrice);
      if (matchingVariant && matchingVariant.size) return matchingVariant.size;
    }
    return variants[0]?.size || '';
  }

  return '';
}

export function getDisplayPrice(product, selectedSizeName, selectedColorName) {
  if (!product) return 0;

  const sizes = product.sizes || [];
  const variants = product.variants || [];

  // Determine effective size: if selectedSizeName is not provided (e.g. on ProductCard), use default size
  const effectiveSize = selectedSizeName !== undefined ? selectedSizeName : getDefaultSizeName(product);

  // 1. Check if size has explicit price
  if (effectiveSize) {
    const sizeObj = sizes.find(s => s.name === effectiveSize);
    if (sizeObj && sizeObj.price !== undefined && sizeObj.price !== null && sizeObj.price !== '') {
      const sp = parseNum(sizeObj.price);
      if (sp > 0) return sp;
    }
  }

  // 2. Check selected variant
  if (effectiveSize || selectedColorName) {
    const variantObj = variants.find(
      v => (!selectedColorName || v.color === selectedColorName) && (!effectiveSize || v.size === effectiveSize)
    );
    if (variantObj && variantObj.price) {
      const vp = parseNum(variantObj.price);
      if (vp > 0) return vp;
    }
  }

  // 3. Fallback to first matching variant if color matched or any variant
  if (effectiveSize) {
    const vMatch = variants.find(v => v.size === effectiveSize);
    if (vMatch && vMatch.price) {
      const vp = parseNum(vMatch.price);
      if (vp > 0) return vp;
    }
  }

  // 4. Base product price
  const bp = parseNum(product.price);
  if (bp > 0) return bp;

  // 5. Fallback to any variant or size price
  for (const v of variants) {
    const vp = parseNum(v.price);
    if (vp > 0) return vp;
  }
  for (const s of sizes) {
    const sp = parseNum(s.price);
    if (sp > 0) return sp;
  }

  return 0;
}

export function getOldPrice(product, currentPrice) {
  if (!product) return 0;
  const cPrice = currentPrice !== undefined ? parseNum(currentPrice) : getDisplayPrice(product);
  if (cPrice <= 0) return 0;

  const rawOldPrice = parseNum(product.oldPrice);
  const basePrice = parseNum(product.price) || cPrice;

  if (rawOldPrice > 0) {
    // If current price differs from base product price (e.g. larger size selected), scale oldPrice proportionally
    if (cPrice !== basePrice && basePrice > 0) {
      const scaled = Math.round(rawOldPrice * (cPrice / basePrice));
      return scaled > cPrice ? scaled : Math.round(cPrice * 1.4);
    }
    if (rawOldPrice > cPrice) return rawOldPrice;
  }

  // Standard fallback markup (40% MRP)
  return Math.round(cPrice * 1.4);
}

export function getDiscountText(product, currentPrice, oldPrice) {
  if (!product) return null;
  if (product.discount) return product.discount;

  const cPrice = currentPrice !== undefined ? parseNum(currentPrice) : getDisplayPrice(product);
  const oPrice = oldPrice !== undefined ? parseNum(oldPrice) : getOldPrice(product, cPrice);

  if (oPrice > cPrice && cPrice > 0) {
    const pct = Math.round(((oPrice - cPrice) / oPrice) * 100);
    if (pct > 0) return `${pct}% OFF`;
  }

  return null;
}
