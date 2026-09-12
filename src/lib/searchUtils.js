import { getDisplayPrice, parseNum } from './priceUtils';

/**
 * Extracts all valid CURRENT selling prices for a product (base, sizes, variants).
 * Strictly excludes oldPrice / MRP so searches only operate on actual selling prices.
 */
export function getCurrentPrices(product) {
  if (!product) return [0];

  const priceSet = new Set();

  const displayPrice = parseNum(getDisplayPrice(product));
  if (displayPrice > 0) priceSet.add(displayPrice);

  const basePrice = parseNum(product.price);
  if (basePrice > 0) priceSet.add(basePrice);

  if (Array.isArray(product.sizes)) {
    for (const s of product.sizes) {
      const sp = parseNum(s.price);
      if (sp > 0) priceSet.add(sp);
    }
  }

  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      const vp = parseNum(v.price);
      if (vp > 0) priceSet.add(vp);
    }
  }

  return priceSet.size > 0 ? Array.from(priceSet) : [0];
}

/**
 * Parses user input to detect natural language price queries, e.g.:
 * - "under 1500", "below 2000", "< 1000", "less than 800", "upto 1200"
 * - "above 1000", "> 2000", "over 1500", "more than 800"
 * - "between 1000 and 2000", "1000 - 2000", "500 to 1500"
 * - "bedsheet under 1500", "curtains 2000"
 * - Standalone numbers like "749", "1299", "1999"
 */
export function parseSearchQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return { text: '', minPrice: null, maxPrice: null, targetPrice: null, original: '', isSerialQuery: false };
  }

  let cleaned = rawQuery.trim();
  const original = cleaned;
  let minPrice = null;
  let maxPrice = null;
  let targetPrice = null;

  // Check if query is an explicit serial number (e.g. KHD-123, #KHD-123, KHD123, KHD 123)
  const isSerialPattern = /^#?khd[-\s]?\d+/i.test(cleaned);

  // 1. Check for "between X and Y" or "X to Y" or "X - Y"
  const rangeMatch = cleaned.match(/(?:between\s+)?₹?\s*(\d+)\s*(?:to|-|and)\s*₹?\s*(\d+)/i);
  if (rangeMatch && !isSerialPattern) {
    const p1 = Number(rangeMatch[1]);
    const p2 = Number(rangeMatch[2]);
    minPrice = Math.min(p1, p2);
    maxPrice = Math.max(p1, p2);
    cleaned = cleaned.replace(rangeMatch[0], ' ').trim();
  }

  // 2. Check for "under X", "below X", "less than X", "<= X", "< X", "upto X", "up to X", "max X", "within X"
  const underMatch = cleaned.match(/(?:under|below|less\s+than|upto|up\s+to|max|within|<=|<)\s*₹?\s*(\d+)/i);
  if (underMatch) {
    maxPrice = Number(underMatch[1]);
    cleaned = cleaned.replace(underMatch[0], ' ').trim();
  }

  // 3. Check for "above X", "over X", "more than X", "min X", "from X", ">= X", "> X"
  const aboveMatch = cleaned.match(/(?:above|over|more\s+than|min|from|>=|>)\s*₹?\s*(\d+)/i);
  if (aboveMatch) {
    minPrice = Number(aboveMatch[1]);
    cleaned = cleaned.replace(aboveMatch[0], ' ').trim();
  }

  // 4. Standalone or "around X" number detection (e.g. "749", "1999" or "bedsheet 749")
  // Only detect as targetPrice if NOT an explicit serial number like KHD-123
  if (!isSerialPattern && minPrice === null && maxPrice === null) {
    const numMatch = cleaned.match(/(?:around|approx|approximately\s+)?(?:^|\s)₹?\s*(\d{2,6})(?:\s|$)/i);
    if (numMatch) {
      targetPrice = Number(numMatch[1]);
      cleaned = cleaned.replace(numMatch[0], ' ').trim();
    }
  }

  // Clean currency words
  cleaned = cleaned.replace(/\b(rs|inr|rupees|rupee|bucks)\b/gi, ' ');
  cleaned = cleaned.replace(/[₹]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return {
    text: cleaned,
    minPrice,
    maxPrice,
    targetPrice,
    original,
    isSerialQuery: isSerialPattern
  };
}

/**
 * Filter and rank products based on parsed text tokens, serial numbers (KHD-123), and CURRENT selling price.
 * MRP / oldPrice is strictly never used for filtering or ranking.
 */
export function searchProducts(products, query) {
  if (!query || !query.trim() || !Array.isArray(products)) {
    return [];
  }

  const rawTrimmed = query.trim();
  const { text, minPrice, maxPrice, targetPrice, isSerialQuery } = parseSearchQuery(rawTrimmed);

  // Normalized variants of the raw query for serial number / code matching
  const rawLower = rawTrimmed.toLowerCase();
  const cleanSerialQuery = rawLower.replace(/^[#\s]+/, '').trim();
  const alphaNumQuery = cleanSerialQuery.replace(/[^a-z0-9]/g, '');
  const digitsOnlyQuery = cleanSerialQuery.replace(/\D/g, '');

  const textTokens = text ? text.toLowerCase().split(/\s+/).filter(Boolean) : [];

  return products.filter(product => {
    if (!product) return false;

    // Resolve product serial number and barcode
    const pNum = (product.productNumber || '').toLowerCase().trim();
    const pNumAlphaNum = pNum.replace(/[^a-z0-9]/g, '');
    const pNumDigits = pNum.replace(/\D/g, '');

    const barcode = (product.barcode || '').toLowerCase().trim();
    const barcodeAlphaNum = barcode.replace(/[^a-z0-9]/g, '');

    // Direct serial number match check
    const directSerialMatch = pNum && (
      pNum === cleanSerialQuery ||
      pNum.includes(cleanSerialQuery) ||
      (alphaNumQuery.length >= 3 && pNumAlphaNum.includes(alphaNumQuery)) ||
      (digitsOnlyQuery.length >= 3 && pNumDigits.includes(digitsOnlyQuery))
    );

    const barcodeMatch = barcode && (
      barcode.includes(cleanSerialQuery) ||
      (alphaNumQuery.length >= 4 && barcodeAlphaNum.includes(alphaNumQuery))
    );

    // If query is an explicit serial query (e.g. KHD-123, #KHD-123) and matches, keep it directly!
    if (isSerialQuery && (directSerialMatch || barcodeMatch)) {
      return true;
    }

    // 1. Resolve product's current selling prices (NEVER oldPrice / MRP)
    const currentPrices = getCurrentPrices(product);

    // 2. Price filtering according to CURRENT selling price
    if (!isSerialQuery) {
      if (maxPrice !== null && minPrice !== null) {
        // Must have at least one current price within the range [minPrice, maxPrice]
        const matchesRange = currentPrices.some(p => p >= minPrice && p <= maxPrice);
        if (!matchesRange) return false;
      } else if (maxPrice !== null) {
        // Must have at least one current price <= maxPrice
        const matchesUnder = currentPrices.some(p => p <= maxPrice);
        if (!matchesUnder) return false;
      } else if (minPrice !== null) {
        // Must have at least one current price >= minPrice
        const matchesAbove = currentPrices.some(p => p >= minPrice);
        if (!matchesAbove) return false;
      } else if (targetPrice !== null) {
        // Target price filter
        const matchesTarget = currentPrices.some(p => {
          if (p === targetPrice) return true;
          if ((targetPrice % 50 === 0 || targetPrice % 100 === 0) && Math.abs(p - targetPrice) <= 5) {
            return true;
          }
          return false;
        });

        // If targetPrice didn't match price, but the digits match product serial number, allow it
        if (!matchesTarget && !directSerialMatch) {
          return false;
        }
      }
    }

    // 3. Text and Serial Number filtering
    if (textTokens.length > 0) {
      const title = (product.title || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      const desc = (product.description || '').toLowerCase();

      // Every token must match title, category, description, product serial number, or barcode
      const allTokensMatch = textTokens.every(token => {
        const cleanToken = token.replace(/^[#\s]+/, '').replace(/[^a-z0-9]/g, '');
        const tokenDigits = token.replace(/\D/g, '');

        return (
          title.includes(token) || 
          category.includes(token) || 
          desc.includes(token) ||
          (pNum && (
            pNum.includes(token) ||
            (cleanToken.length >= 3 && pNumAlphaNum.includes(cleanToken)) ||
            (tokenDigits.length >= 3 && pNumDigits.includes(tokenDigits))
          )) ||
          (barcode && (
            barcode.includes(token) ||
            (cleanToken.length >= 4 && barcodeAlphaNum.includes(cleanToken))
          ))
        );
      });

      if (!allTokensMatch && !directSerialMatch) return false;
    }

    return true;
  }).sort((a, b) => {
    // 1. Direct serial number matches rank highest
    const aNum = (a.productNumber || '').toLowerCase().trim();
    const bNum = (b.productNumber || '').toLowerCase().trim();
    const aAlpha = aNum.replace(/[^a-z0-9]/g, '');
    const bAlpha = bNum.replace(/[^a-z0-9]/g, '');

    const aExactSerial = aNum === cleanSerialQuery || aAlpha === alphaNumQuery;
    const bExactSerial = bNum === cleanSerialQuery || bAlpha === alphaNumQuery;
    if (aExactSerial && !bExactSerial) return -1;
    if (!aExactSerial && bExactSerial) return 1;

    const aStartsSerial = aNum.startsWith(cleanSerialQuery) || aAlpha.startsWith(alphaNumQuery);
    const bStartsSerial = bNum.startsWith(cleanSerialQuery) || bAlpha.startsWith(alphaNumQuery);
    if (aStartsSerial && !bStartsSerial) return -1;
    if (!aStartsSerial && bStartsSerial) return 1;

    // 2. Title matching priority
    if (text) {
      const lowerText = text.toLowerCase();
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      if (aTitle.startsWith(lowerText) && !bTitle.startsWith(lowerText)) return -1;
      if (!aTitle.startsWith(lowerText) && bTitle.startsWith(lowerText)) return 1;
    }

    // 3. Price closeness
    if (targetPrice !== null) {
      const aPrices = getCurrentPrices(a);
      const bPrices = getCurrentPrices(b);
      const aMinDiff = Math.min(...aPrices.map(p => Math.abs(p - targetPrice)));
      const bMinDiff = Math.min(...bPrices.map(p => Math.abs(p - targetPrice)));
      return aMinDiff - bMinDiff;
    }

    return 0;
  });
}
