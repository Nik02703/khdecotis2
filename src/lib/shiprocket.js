// Shiprocket Authentication & Request Helper
// Token is cached in-memory with 9-day expiry and auto-refreshed on 401

let cachedToken = null;
let tokenExpiry = null;

/**
 * Authenticate with Shiprocket and return a Bearer token.
 * Caches the token for 9 days (Shiprocket tokens last ~10 days).
 * Returns null gracefully if credentials are missing.
 */
export async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.warn('[Shiprocket] SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not configured.');
    return null;
  }

  // Return cached token if still valid
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Auth failed with status ${response.status}`);
    }

    cachedToken = data.token;

    // Cache for 9 days (Shiprocket tokens expire after ~10 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 9);
    tokenExpiry = expiryDate;

    console.log('[Shiprocket] Token acquired successfully, cached until', expiryDate.toISOString());
    return cachedToken;
  } catch (error) {
    console.error('[Shiprocket] Auth Error:', error.message);
    return null;
  }
}

/**
 * Clear the cached token (used on 401 responses to force re-auth).
 */
export function invalidateShiprocketToken() {
  cachedToken = null;
  tokenExpiry = null;
  console.log('[Shiprocket] Token cache invalidated.');
}

/**
 * Execute a Shiprocket API call with automatic 401 retry.
 * If the first call returns 401, the token is invalidated,
 * a fresh token is fetched, and the request is retried once.
 *
 * @param {string} url - Full Shiprocket API URL
 * @param {object} options - fetch options (method, body, etc.) — Authorization header is injected automatically
 * @returns {{ response: Response, data: object }} - The response and parsed JSON
 * @throws Error if auth fails or retry also fails
 */
export async function shiprocketFetch(url, options = {}) {
  const makeRequest = async (token) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    return { response: res, data };
  };

  // First attempt
  let token = await getShiprocketToken();
  if (!token) {
    throw new Error('Shiprocket authentication failed — no token available.');
  }

  let result = await makeRequest(token);

  // On 401, invalidate cached token → get fresh one → retry once
  if (result.response.status === 401) {
    console.warn('[Shiprocket] 401 received, invalidating token and retrying...');
    invalidateShiprocketToken();

    token = await getShiprocketToken();
    if (!token) {
      throw new Error('Shiprocket re-authentication failed after 401.');
    }

    result = await makeRequest(token);

    if (result.response.status === 401) {
      throw new Error('Shiprocket 401 persisted after token refresh. Check credentials.');
    }
  }

  return result;
}
