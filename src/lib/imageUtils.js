/**
 * Encodes image paths safely for all browsers, CDNs, and production environments.
 * Handles spaces, pipes (|), colons (:), plus signs (+), and special characters
 * commonly found in product catalog asset paths.
 */
export function encodeImg(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;

  return url
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}
