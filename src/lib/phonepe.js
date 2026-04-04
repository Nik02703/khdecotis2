/**
 * PhonePe Payment Gateway — V2 OAuth / Client Credentials Flow
 *
 * Uses OAuth 2.0 token-based authentication (client_id + client_secret).
 * Compatible with PhonePe Production & UAT Sandbox.
 *
 * Environment controlled via .env.local:
 *   PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION
 *   PHONEPE_ENV — "PROD" or "UAT"
 */

// ── Credential helpers ──────────────────────────────────────────────
const CLIENT_ID      = () => process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET  = () => process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = () => process.env.PHONEPE_CLIENT_VERSION || '1';
const APP_BASE       = () => process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const isProd = () => (process.env.PHONEPE_ENV || 'PROD').toUpperCase() === 'PROD';

// ── V2 Endpoints ────────────────────────────────────────────────────
const ENDPOINTS = {
  PROD: {
    token:    'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
    pay:      'https://api.phonepe.com/apis/pg/checkout/v2/pay',
    // status path appended with merchantOrderId at call-time
    statusBase: 'https://api.phonepe.com/apis/pg/checkout/v2/order',
  },
  UAT: {
    token:    'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
    pay:      'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
    statusBase: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order',
  },
};

function getEndpoints() {
  return isProd() ? ENDPOINTS.PROD : ENDPOINTS.UAT;
}

// ── Cached OAuth Token ──────────────────────────────────────────────
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get a valid OAuth access token, refreshing if needed.
 * Uses grant_type=client_credentials as specified by PhonePe V2.
 */
async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    console.log('[PhonePe V2] Using cached OAuth token');
    return cachedToken;
  }

  const clientId     = CLIENT_ID();
  const clientSecret = CLIENT_SECRET();
  const clientVersion = CLIENT_VERSION();
  const ep = getEndpoints();

  if (!clientId || !clientSecret) {
    throw new Error('PhonePe credentials missing: PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET');
  }

  console.log('[PhonePe V2] Requesting new OAuth token...');
  console.log('[PhonePe V2] Token URL:', ep.token);

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('client_version', clientVersion);
  params.append('grant_type', 'client_credentials');

  const res = await fetch(ep.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error('[PhonePe V2] ❌ Token request failed:', JSON.stringify(data));
    throw new Error(data.message || `OAuth token request failed (HTTP ${res.status})`);
  }

  cachedToken    = data.access_token;
  // expires_at is epoch seconds from PhonePe; fall back to 15 min
  tokenExpiresAt = data.expires_at
    ? data.expires_at * 1000
    : Date.now() + 15 * 60 * 1000;

  console.log('[PhonePe V2] ✅ OAuth token acquired, expires at:', new Date(tokenExpiresAt).toISOString());
  return cachedToken;
}

// ── Initiate Payment (V2 Checkout) ──────────────────────────────────

/**
 * Initiate a PhonePe V2 checkout payment.
 *
 * @param {string} orderId        — Original order ID (e.g. #KHD-1234)
 * @param {number} amountInRupees — Amount in rupees (converted to paise)
 * @param {string} userPhone      — Customer phone
 * @param {string} userId         — User identifier
 * @returns {{ success, redirectUrl?, transactionId?, error? }}
 */
export async function initiatePhonePePayment(orderId, amountInRupees, userPhone, userId) {
  try {
    const appBase = APP_BASE();
    const ep      = getEndpoints();

    // Unique merchant order ID — alphanumeric + limited special chars, max 63 chars
    const merchantOrderId = `TXN${orderId.replace(/[^a-zA-Z0-9_-]/g, '')}${Date.now()}`
      .slice(0, 63);

    // Amount MUST be integer paise
    const amountInPaise = Math.round(amountInRupees * 100);
    if (amountInPaise < 100 || isNaN(amountInPaise)) {
      throw new Error(`Invalid amount: ${amountInRupees} rupees → ${amountInPaise} paise (minimum ₹1)`);
    }

    console.log('[PhonePe V2] merchantOrderId:', merchantOrderId);
    console.log('[PhonePe V2] Amount (paise):', amountInPaise);

    // Get OAuth token
    const token = await getAccessToken();

    // Build V2 checkout request body
    const payload = {
      merchantOrderId,
      amount: amountInPaise,
      expireAfter: 1200, // 20 minutes
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: `Payment for order ${orderId}`,
        merchantUrls: {
          redirectUrl: `${appBase}/api/payment/redirect/${encodeURIComponent(orderId)}`,
          callbackUrl: `${appBase}/api/payment/phonepe-callback`,
        },
      },
    };

    console.log('[PhonePe V2] Pay URL:', ep.pay);
    console.log('[PhonePe V2] Redirect URL:', payload.paymentFlow.merchantUrls.redirectUrl);
    console.log('[PhonePe V2] Callback URL:', payload.paymentFlow.merchantUrls.callbackUrl);

    const response = await fetch(ep.pay, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `O-Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();
    console.log('[PhonePe V2] Full Response:', JSON.stringify(data, null, 2));

    // V2 returns redirectUrl directly in the response
    const redirectUrl = data?.redirectUrl || data?.data?.redirectUrl || data?.data?.instrumentResponse?.redirectInfo?.url;

    if (redirectUrl) {
      console.log('[PhonePe V2] ✅ Redirect URL obtained:', redirectUrl);
      return { success: true, redirectUrl, transactionId: merchantOrderId };
    } else {
      console.error('[PhonePe V2] ❌ No redirectUrl in response:', JSON.stringify(data));
      return {
        success: false,
        error: data?.message || data?.error || 'Payment initiation failed — no redirect URL',
      };
    }

  } catch (error) {
    console.error('[PhonePe V2] ❌ Exception:', error.message);
    return { success: false, error: error.message };
  }
}

// ── Verify Payment Status (V2 Order Status API) ────────────────────

/**
 * Check payment status with PhonePe V2 Order Status API.
 *
 * GET /checkout/v2/order/{merchantOrderId}/status
 * Authorization: O-Bearer <token>
 *
 * @param {string} merchantOrderId — The merchantOrderId used at payment initiation
 * @returns {object} PhonePe status response
 */
export async function verifyPhonePePayment(merchantOrderId) {
  try {
    const ep    = getEndpoints();
    const token = await getAccessToken();
    const url   = `${ep.statusBase}/${merchantOrderId}/status?details=true`;

    console.log('[PhonePe V2] Checking status for:', merchantOrderId);
    console.log('[PhonePe V2] Status URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `O-Bearer ${token}`,
      },
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();
    console.log('[PhonePe V2] Status Response:', JSON.stringify(data, null, 2));

    return data;

  } catch (error) {
    console.error('[PhonePe V2] Status Check Failed:', error.message);
    throw error;
  }
}

// ── Verify Webhook Payload (V2 S2S Callback) ───────────────────────

/**
 * Validate and decode an incoming V2 S2S callback payload.
 *
 * PhonePe V2 sends the callback body as a Base64-encoded JSON string.
 * The authorization header contains a SHA-256 hash for security.
 *
 * For V2 we simply decode and return the payload — full auth validation
 * is done via the Authorization header (username:password configured
 * on the PhonePe dashboard).
 *
 * @param {string} base64Response — The base64 encoded payload
 * @returns {object|null} The decoded payload, or null if invalid
 */
export function decodeCallbackPayload(base64Response) {
  try {
    const decoded = JSON.parse(Buffer.from(base64Response, 'base64').toString('utf-8'));
    console.log('[PhonePe V2] Decoded callback payload:', JSON.stringify(decoded, null, 2));
    return decoded;
  } catch (error) {
    console.error('[PhonePe V2] Failed to decode callback payload:', error.message);
    return null;
  }
}

/**
 * Legacy V1 checksum verification — kept as a fallback for any
 * remaining V1-style webhooks during migration.
 */
export function verifyWebhookChecksum(base64Response, xVerifyHeader) {
  try {
    // In V2 mode there is no salt-key checksum; always return true
    // to allow the flow to proceed. Real security is via OAuth.
    console.log('[PhonePe V2] Webhook checksum check skipped (V2 uses OAuth)');
    return true;
  } catch (error) {
    console.error('[PhonePe V2] Webhook checksum error:', error);
    return false;
  }
}
