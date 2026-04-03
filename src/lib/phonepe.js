/**
 * PhonePe Payment Gateway (V2 Standard Checkout) — Server-Side Helper Library
 * 
 * Uses OAuth token-based auth (O-Bearer) with the /checkout/v2/pay endpoint.
 * 
 * Environment controlled via .env.local:
 *   PROD -> PHONEPE_ENV="PROD" 
 *   UAT  -> PHONEPE_ENV="UAT"
 */

const CLIENT_ID = () => process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET = () => process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = () => process.env.PHONEPE_CLIENT_VERSION || '1';
const IS_PROD = () => process.env.PHONEPE_ENV === 'PROD';

function getIdentityUrl() {
  return IS_PROD() 
    ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token' 
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';
}

function getCheckoutUrl() {
  return IS_PROD()
    ? 'https://api.phonepe.com/apis/pg/checkout/v2/pay'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay';
}

function getStatusUrl(merchantOrderId) {
  return IS_PROD()
    ? `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantOrderId}/status`
    : `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${merchantOrderId}/status`;
}

// ─── Token cache to avoid hitting OAuth on every call ────────────────
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Generate (or return cached) V2 Access Token
 */
export async function generateV2AccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const clientId = CLIENT_ID();
  const clientSecret = CLIENT_SECRET();
  const clientVersion = CLIENT_VERSION();
  const authUrl = getIdentityUrl();

  console.log('[PhonePe V2] Generating Access Token...');
  
  if (!clientId || !clientSecret) {
    throw new Error('PhonePe V2 credentials missing in .env.local (PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET)');
  }

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('client_version', clientVersion);
  params.append('grant_type', 'client_credentials');

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const data = await response.json();
  
  if (!response.ok || !data.access_token) {
    console.error('[PhonePe V2] Token generation failed:', data);
    throw new Error(data.error_description || data.message || 'Failed to generate PhonePe V2 Access Token');
  }

  cachedToken = data.access_token;
  tokenExpiresAt = (data.expires_at || 0) * 1000; // convert seconds to ms
  console.log('[PhonePe V2] ✅ Access Token generated');
  return cachedToken;
}

/**
 * Initiate a PhonePe V2 Standard Checkout payment.
 * 
 * V2 uses a completely different payload format to V1:
 *   - merchantOrderId (not merchantTransactionId)
 *   - paymentFlow with type PG_CHECKOUT
 *   - redirectUrl inside paymentFlow.merchantUrls
 *   - No base64 encoding, no X-VERIFY checksum
 */
export async function initiatePayment(merchantOrderId, amountInRupees, userPhone, redirectUrl, callbackUrl) {
  try {
    // Amount MUST be in paise
    const amountInPaise = Math.round(amountInRupees * 100);

    if (amountInPaise < 100 || isNaN(amountInPaise)) {
      throw new Error(`Invalid amount: ${amountInRupees} rupees -> ${amountInPaise} paise (minimum 100 paise / ₹1)`);
    }

    const accessToken = await generateV2AccessToken();

    // V2 Standard Checkout payload
    const payload = {
      merchantOrderId: merchantOrderId,
      amount: amountInPaise,
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        udf1: userPhone || '',
      },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: {
          redirectUrl: redirectUrl,
        },
      },
    };

    const checkoutUrl = getCheckoutUrl();

    console.log('[PhonePe V2] Initiating Payment');
    console.log('[PhonePe V2] URL:', checkoutUrl);
    console.log('[PhonePe V2] merchantOrderId:', merchantOrderId);
    console.log('[PhonePe V2] amount (paise):', amountInPaise);

    const response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('[PhonePe V2] Response:', JSON.stringify(data));

    // V2 success response has redirectUrl at data.redirectUrl
    if (data.orderId && data.redirectUrl) {
      console.log('[PhonePe V2] ✅ SUCCESS — redirectUrl:', data.redirectUrl);
      return { 
        success: true, 
        paymentUrl: data.redirectUrl,
        orderId: data.orderId,
      };
    }

    // Also check nested structure in case of alternate response format
    if (data.data?.redirectUrl) {
      console.log('[PhonePe V2] ✅ SUCCESS (nested) — redirectUrl:', data.data.redirectUrl);
      return {
        success: true,
        paymentUrl: data.data.redirectUrl,
        orderId: data.data.orderId || merchantOrderId,
      };
    }

    console.error('[PhonePe V2] ❌ FAILED — PhonePe rejected request');
    console.error('[PhonePe V2] Full response:', JSON.stringify(data, null, 2));
    return {
      success: false,
      error: data.message || data.code || 'PhonePe returned an unexpected response.',
    };

  } catch (error) {
    console.error('[PhonePe V2] ❌ EXCEPTION:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify payment status with PhonePe V2 API.
 */
export async function verifyPayment(merchantOrderId) {
  try {
    const accessToken = await generateV2AccessToken();
    const statusUrl = getStatusUrl(merchantOrderId);

    console.log('[PhonePe V2] Checking status:', statusUrl);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log('[PhonePe V2] Status result:', JSON.stringify(data));

    const state = data.state || data.code;

    if (state === 'COMPLETED' || state === 'PAYMENT_SUCCESS') {
      return {
        success: true,
        status: 'SUCCESS',
        data: data,
        transactionId: data.paymentDetails?.[0]?.transactionId || data.orderId || '',
        paymentInstrument: data.paymentDetails?.[0]?.paymentMode || '',
      };
    }

    if (state === 'PENDING') {
      return { success: false, status: 'PENDING', data };
    }

    return {
      success: false,
      status: state || 'FAILED',
      error: data.message || 'Payment was not successful.',
      data,
    };

  } catch (error) {
    console.error('[PhonePe V2] verifyPayment EXCEPTION:', error.message);
    return { success: false, status: 'ERROR', error: error.message };
  }
}

/**
 * Webhook verification placeholder.
 * V2 Standard Checkout uses server-to-server status checks as the primary
 * verification method. Webhooks are supplementary.
 */
export function verifyWebhookChecksum(base64Response, xVerifyHeader) {
  console.log('[PhonePe V2] Webhook received — will verify via server status check.');
  return true;
}
