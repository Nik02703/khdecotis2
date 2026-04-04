import crypto from 'crypto';

/**
 * PhonePe Payment Gateway Integration
 * Supports BOTH V1 (Salt Key) and V2 (OAuth Client Credentials)
 * 
 * It auto-detects the flow based on .env.local:
 * - If PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY are present, uses V1 (Standard for UAT)
 * - If PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET are present, uses V2 (OAuth for PROD)
 */

const APP_BASE = () => process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const isProd = () => (process.env.PHONEPE_ENV || 'PROD').toUpperCase() === 'PROD';

// --- V1 Credentials ---
const MERCHANT_ID = () => process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY    = () => process.env.PHONEPE_SALT_KEY;
const SALT_INDEX  = () => process.env.PHONEPE_SALT_INDEX || '1';
const V1_BASE_URL = () => process.env.PHONEPE_BASE_URL || (isProd() ? 'https://api.phonepe.com/apis/hermes' : 'https://api-preprod.phonepe.com/apis/pg-sandbox');

// --- V2 Credentials ---
const CLIENT_ID      = () => process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET  = () => process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = () => process.env.PHONEPE_CLIENT_VERSION || '1';

const V2_ENDPOINTS = {
  PROD: {
    token:    'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
    pay:      'https://api.phonepe.com/apis/pg/checkout/v2/pay',
    statusBase: 'https://api.phonepe.com/apis/pg/checkout/v2/order',
  },
  UAT: {
    token:    'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
    pay:      'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
    statusBase: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order',
  },
};

// State
let cachedToken = null;
let tokenExpiresAt = 0;

function isV2Mode() {
  return (!process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_CLIENT_ID);
}

// ─────────────────────────────────────────────────────────────────────────────
// V1 HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function generateV1Checksum(base64Payload, endpoint) {
  const str  = base64Payload + endpoint + SALT_KEY();
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return `${hash}###${SALT_INDEX()}`;
}

export function verifyWebhookChecksum(base64Response, xVerifyHeader) {
  try {
    if (isV2Mode()) return true; // V2 uses OAuth instead of checksums
    const str  = base64Response + SALT_KEY();
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    const expected = `${hash}###${SALT_INDEX()}`;
    return expected === xVerifyHeader;
  } catch (error) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// V2 HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getV2AccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const ep = isProd() ? V2_ENDPOINTS.PROD : V2_ENDPOINTS.UAT;
  console.log('[PhonePe V2] Requesting OAuth token...');

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID());
  params.append('client_secret', CLIENT_SECRET());
  params.append('client_version', CLIENT_VERSION());
  params.append('grant_type', 'client_credentials');

  const res = await fetch(ep.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(data.message || `OAuth token request failed (${res.status})`);

  cachedToken = data.access_token;
  tokenExpiresAt = data.expires_at ? data.expires_at * 1000 : Date.now() + 15 * 60 * 1000;
  return cachedToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN API EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initiate Payment (Handles both V1 and V2)
 */
export async function initiatePhonePePayment(orderId, amountInRupees, userPhone, userId) {
  try {
    const appBase = APP_BASE();
    const amountInPaise = Math.round(amountInRupees * 100);
    if (amountInPaise < 100) throw new Error('Invalid amount (minimum ₹1)');

    const transactionId = `TXN${orderId.replace(/[^a-zA-Z0-9_-]/g, '')}${Date.now()}`.slice(0, 36);

    // --- V2 MODE ---
    if (isV2Mode()) {
      const ep = isProd() ? V2_ENDPOINTS.PROD : V2_ENDPOINTS.UAT;
      const token = await getV2AccessToken();
      const payload = {
        merchantOrderId: transactionId,
        amount: amountInPaise,
        expireAfter: 1200,
        paymentFlow: {
          type: 'PG_CHECKOUT',
          message: `Payment for order ${orderId}`,
          merchantUrls: {
            redirectUrl: `${appBase}/api/payment/redirect/${encodeURIComponent(orderId)}`,
            callbackUrl: `${appBase}/api/payment/phonepe-callback`,
          },
        },
      };

      const response = await fetch(ep.pay, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `O-Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const redirectUrl = data?.redirectUrl || data?.data?.redirectUrl || data?.data?.instrumentResponse?.redirectInfo?.url;
      
      if (redirectUrl) return { success: true, redirectUrl, transactionId };
      return { success: false, error: data?.message || 'V2 Payment initiation failed' };
    }

    // --- V1 MODE ---
    else {
      const payload = {
        merchantId:            MERCHANT_ID(),
        merchantTransactionId: transactionId,
        merchantUserId:        `USR${(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '')}`.slice(0, 36),
        amount:                amountInPaise,
        redirectUrl:           `${appBase}/api/payment/redirect/${encodeURIComponent(orderId)}`,
        redirectMode:          'REDIRECT',
        callbackUrl:           `${appBase}/api/payment/phonepe-callback`,
        mobileNumber:          userPhone || undefined,
        paymentInstrument: { type: 'PAY_PAGE' },
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const endpoint      = '/pg/v1/pay';
      const checksum      = generateV1Checksum(base64Payload, endpoint);
      const url           = `${V1_BASE_URL()}${endpoint}`;

      const response = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'X-VERIFY':      checksum,
          'X-MERCHANT-ID': MERCHANT_ID(),
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      const data = await response.json();
      if (data?.success) {
        const redirectUrl = data.data?.instrumentResponse?.redirectInfo?.url;
        return { success: true, redirectUrl, transactionId };
      }
      return { success: false, error: data?.message || 'V1 Payment initiation failed' };
    }

  } catch (error) {
    console.error('[PhonePe Initiate] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify Payment Status (Handles both V1 and V2)
 */
export async function verifyPhonePePayment(merchantOrderId) {
  try {
    // --- V2 MODE ---
    if (isV2Mode()) {
      const ep = isProd() ? V2_ENDPOINTS.PROD : V2_ENDPOINTS.UAT;
      const token = await getV2AccessToken();
      const url = `${ep.statusBase}/${merchantOrderId}/status?details=true`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `O-Bearer ${token}`,
        },
      });
      return await response.json();
    } 
    // --- V1 MODE ---
    else {
      const endpoint = `/pg/v1/status/${MERCHANT_ID()}/${merchantOrderId}`;
      const checksum = generateV1Checksum('', endpoint);
      const url = `${V1_BASE_URL()}${endpoint}`;

      const response = await fetch(url, {
        method:  'GET',
        headers: {
          'Content-Type':  'application/json',
          'X-VERIFY':      checksum,
          'X-MERCHANT-ID': MERCHANT_ID(),
        },
      });
      return await response.json();
    }
  } catch (error) {
    console.error('[PhonePe Status Check] Failed:', error.message);
    throw error;
  }
}

/**
 * Decode Callback Payload
 */
export function decodeCallbackPayload(base64Response) {
  try {
    return JSON.parse(Buffer.from(base64Response, 'base64').toString('utf-8'));
  } catch (error) {
    console.error('[PhonePe Callback Decode] Failed:', error.message);
    return null;
  }
}
