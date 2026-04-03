// ═══════════════════════════════════════════════════════════════════════
// Shiprocket API — Authentication & Request Helper
// ═══════════════════════════════════════════════════════════════════════
// • Token cached in-memory with 23-hour expiry (Shiprocket tokens last 24h)
// • Auto-refresh via setInterval — runs every 23 hours
// • Automatic 401 retry — if any call gets 401, re-auth + retry once
// • 10-second timeout on ALL API calls to prevent hanging requests
// ═══════════════════════════════════════════════════════════════════════

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiry = null;
let refreshTimer = null;

// ─── AUTO-REFRESH SETUP ─────────────────────────────────────────────
// Schedule a token refresh every 23 hours so we never hit the 24h expiry
function scheduleAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;
  refreshTimer = setInterval(async () => {
    console.log('[Shiprocket] ⏰ Auto-refreshing token (23h interval)...');
    invalidateShiprocketToken();
    await getShiprocketToken();
  }, TWENTY_THREE_HOURS);
  // Ensure the timer doesn't prevent Node from exiting
  if (refreshTimer.unref) refreshTimer.unref();
}

/**
 * Authenticate with Shiprocket and return a Bearer token.
 * Caches the token for 23 hours (expires in 24h on Shiprocket).
 * Starts an auto-refresh timer on first successful auth.
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Auth failed with status ${response.status}`);
    }

    cachedToken = data.token;

    // Cache for 23 hours (Shiprocket tokens expire after 24 hours)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 23);
    tokenExpiry = expiryDate;

    // Start the auto-refresh timer on first successful auth
    scheduleAutoRefresh();

    console.log('[Shiprocket] ✅ Token acquired, cached until', expiryDate.toISOString());
    return cachedToken;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Shiprocket] Auth request timed out (10s).');
    } else {
      console.error('[Shiprocket] Auth Error:', error.message);
    }
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
 * Execute a Shiprocket API call with:
 *  - Automatic Bearer token injection
 *  - 10-second request timeout
 *  - Automatic 401 retry (invalidate → re-auth → retry once)
 *
 * @param {string} url - Full Shiprocket API URL
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {{ response: Response, data: object }}
 * @throws Error if auth fails, timeout, or retry also fails
 */
export async function shiprocketFetch(url, options = {}) {
  const makeRequest = async (token) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();
      return { response: res, data };
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error(`Shiprocket API request timed out (10s) — URL: ${url}`);
      }
      throw error;
    }
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

// ═══════════════════════════════════════════════════════════════════════
// HIGH-LEVEL SHIPROCKET FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create an order on Shiprocket (adhoc).
 * Maps our internal order object to Shiprocket's expected format.
 *
 * @param {object} orderData - Must include:
 *   order_id, customer name/phone/email, shipping address,
 *   products[], payment_method ('COD'|'Prepaid'), total, dimensions
 * @returns {object} Shiprocket response { order_id, shipment_id, ... }
 * @throws Error on API failure
 */
export async function createShiprocketOrder(orderData) {
  const {
    order_id,
    customer_name,
    customer_last_name = '',
    customer_phone,
    customer_email,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_pincode,
    products = [],
    payment_method = 'Prepaid', // 'COD' or 'Prepaid'
    total_amount,
    length = 10,
    breadth = 10,
    height = 10,
    weight = 0.5,
  } = orderData;

  // Strip special characters from order_id — Shiprocket rejects # and other symbols
  const cleanOrderId = String(order_id).replace(/[^a-zA-Z0-9\-_]/g, '');

  const shiprocketPayload = {
    order_id: cleanOrderId,
    order_date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    billing_customer_name: customer_name || 'Customer',
    billing_last_name: customer_last_name,
    billing_address: shipping_address || 'Address Pending',
    billing_city: shipping_city || 'Unknown',
    billing_pincode: String(shipping_pincode || '000000'),
    billing_state: shipping_state || 'Unknown',
    billing_country: 'India',
    billing_email: customer_email || 'customer@example.com',
    billing_phone: String(customer_phone || '0000000000'),
    shipping_is_billing: true,
    order_items: products.map((item, idx) => ({
      name: item.name || item.title || 'Product Item',
      sku: item.sku || item.id || `SKU-${cleanOrderId}-${idx}`,
      units: item.quantity || item.units || 1,
      selling_price: typeof item.price === 'string'
        ? parseFloat(item.price.replace(/,/g, ''))
        : (item.price || 0),
    })),
    payment_method: payment_method, // 'COD' or 'Prepaid'
    sub_total: typeof total_amount === 'string'
      ? parseFloat(total_amount.replace(/[^0-9.-]+/g, ''))
      : (total_amount || 0),
    length,
    breadth,
    height,
    weight,
  };

  console.log('[Shiprocket] Creating order:', cleanOrderId, '| Payment:', payment_method);

  const { response, data } = await shiprocketFetch(
    `${SHIPROCKET_BASE}/orders/create/adhoc`,
    {
      method: 'POST',
      body: JSON.stringify(shiprocketPayload),
    }
  );

  if (!response.ok) {
    console.error('[Shiprocket] Create order API error:', JSON.stringify(data));
    throw new Error(data.message || `Shiprocket returned status ${response.status}`);
  }

  console.log('[Shiprocket] ✅ Order created. SR Order ID:', data.order_id, '| Shipment ID:', data.shipment_id);
  return data;
}

/**
 * Assign a courier and generate AWB for a shipment.
 *
 * @param {string} shipment_id - Shiprocket shipment ID
 * @returns {{ awb_code: string, courier_name: string, ...rest }}
 * @throws Error on API failure
 */
export async function assignCourier(shipment_id) {
  console.log('[Shiprocket] Assigning courier for shipment:', shipment_id);

  const { response, data } = await shiprocketFetch(
    `${SHIPROCKET_BASE}/courier/assign/awb`,
    {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: shipment_id,
        courier_id: '', // Empty = Shiprocket auto-assigns best courier
      }),
    }
  );

  if (!response.ok) {
    console.error('[Shiprocket] AWB API error:', JSON.stringify(data));
    throw new Error(data.message || `AWB API returned status ${response.status}`);
  }

  if (data.response && data.response.data) {
    const awbCode = data.response.data.awb_code;
    const courierName = data.response.data.courier_name;
    console.log('[Shiprocket] ✅ AWB assigned:', awbCode, '| Courier:', courierName);
    return {
      awb_code: awbCode || '',
      courier_name: courierName || '',
      raw: data.response.data,
    };
  }

  throw new Error('Shiprocket returned unexpected AWB response structure.');
}

/**
 * Track a shipment by its AWB code.
 * Returns structured tracking information.
 *
 * @param {string} awb_code - The AWB tracking number
 * @returns {{ current_status, expected_delivery_date, events[] }}
 */
export async function trackShipment(awb_code) {
  console.log('[Shiprocket] Tracking AWB:', awb_code);

  const { response, data } = await shiprocketFetch(
    `${SHIPROCKET_BASE}/courier/track/awb/${awb_code}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    console.warn('[Shiprocket] Track API error for AWB', awb_code, ':', JSON.stringify(data));
    return {
      current_status: 'unknown',
      expected_delivery_date: null,
      events: [],
      error: data.message || 'Tracking API returned an error.',
    };
  }

  const trackingData = data.tracking_data || {};

  // Handle Shiprocket-level errors (common if shipment was just created)
  if (trackingData.error) {
    return {
      current_status: 'Manifesting',
      expected_delivery_date: null,
      events: [],
      message: 'Shipment is being processed by the courier.',
    };
  }

  // Extract live tracking details
  const shipmentTrack = Array.isArray(trackingData.shipment_track)
    ? trackingData.shipment_track[0]
    : trackingData.shipment_track;

  const activities = trackingData.shipment_track_activities || [];

  return {
    current_status: shipmentTrack?.current_status || 'Processing',
    expected_delivery_date: shipmentTrack?.expected_date || null,
    events: activities.slice(0, 15).map(act => ({
      date: act.date || '',
      activity: act.activity || act.status || '',
      location: act.location || '',
    })),
  };
}

/**
 * Cancel one or more orders on Shiprocket.
 *
 * @param {string[]} order_ids - Array of Shiprocket order IDs to cancel
 * @returns {object} Shiprocket cancellation response
 * @throws Error on API failure
 */
export async function cancelShiprocketOrder(order_ids) {
  console.log('[Shiprocket] Cancelling orders:', order_ids);

  const { response, data } = await shiprocketFetch(
    `${SHIPROCKET_BASE}/orders/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ ids: order_ids }),
    }
  );

  if (!response.ok) {
    console.error('[Shiprocket] Cancel order error:', JSON.stringify(data));
    throw new Error(data.message || `Cancel API returned status ${response.status}`);
  }

  console.log('[Shiprocket] ✅ Orders cancelled:', order_ids);
  return data;
}
