/**
 * PhonePe Payment Gateway — Server-Side Helper Library
 * 
 * Handles checksum generation, payment initiation, and verification.
 * All credentials are pulled from environment variables — never hardcoded.
 * 
 * Test mode vs Live mode is controlled entirely via .env.local:
 *   UAT  → PHONEPE_BASE_URL = https://api-preprod.phonepe.com/apis/pg-sandbox
 *   PROD → PHONEPE_BASE_URL = https://api.phonepe.com/apis/hermes
 * 
 * ── TESTING INSTRUCTIONS ──────────────────────────────────────────
 * Test UPI ID (success):  success@ybl
 * Test UPI ID (failure):  failure@ybl
 * Test card: any valid format works in sandbox
 * Sandbox URL: https://api-preprod.phonepe.com/apis/pg-sandbox
 * ──────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';

const MERCHANT_ID = () => process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = () => process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = () => process.env.PHONEPE_SALT_INDEX || '1';
const BASE_URL = () => process.env.PHONEPE_BASE_URL;

/**
 * Generate PhonePe X-VERIFY checksum.
 * Formula: SHA256(base64Payload + "/pg/v1/pay" + saltKey) + "###" + saltIndex
 */
export function generateChecksum(base64Payload, apiEndpoint) {
  const saltKey = SALT_KEY();
  const saltIndex = SALT_INDEX();

  const stringToHash = base64Payload + apiEndpoint + saltKey;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  const checksum = sha256Hash + '###' + saltIndex;

  // DEBUG: Log checksum components
  console.log('[PhonePe DEBUG] ── Checksum Generation ──');
  console.log('[PhonePe DEBUG] API Endpoint:', apiEndpoint);
  console.log('[PhonePe DEBUG] Salt Key (first 8 chars):', saltKey?.substring(0, 8) + '...');
  console.log('[PhonePe DEBUG] Salt Index:', saltIndex);
  console.log('[PhonePe DEBUG] String to hash (first 80 chars):', stringToHash.substring(0, 80) + '...');
  console.log('[PhonePe DEBUG] SHA256 Hash:', sha256Hash);
  console.log('[PhonePe DEBUG] Final Checksum:', checksum.substring(0, 40) + '...');

  return checksum;
}

/**
 * Generate checksum for status check (GET requests).
 * Formula: SHA256(apiEndpoint + saltKey) + "###" + saltIndex
 */
export function generateStatusChecksum(apiEndpoint) {
  const saltKey = SALT_KEY();
  const saltIndex = SALT_INDEX();

  const stringToHash = apiEndpoint + saltKey;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');

  return sha256Hash + '###' + saltIndex;
}

/**
 * Initiate a PhonePe payment and return the redirect URL.
 */
export async function initiatePayment(merchantTransactionId, amountInRupees, userPhone, redirectUrl, callbackUrl) {
  try {
    const merchantId = MERCHANT_ID();
    const baseUrl = BASE_URL();

    // DEBUG: Log environment configuration
    console.log('[PhonePe DEBUG] ══════════════════════════════════════');
    console.log('[PhonePe DEBUG] INITIATING PAYMENT');
    console.log('[PhonePe DEBUG] ══════════════════════════════════════');
    console.log('[PhonePe DEBUG] Merchant ID:', merchantId);
    console.log('[PhonePe DEBUG] Base URL:', baseUrl);
    console.log('[PhonePe DEBUG] Salt Key loaded:', !!SALT_KEY());
    console.log('[PhonePe DEBUG] Salt Index:', SALT_INDEX());

    if (!merchantId || !baseUrl) {
      console.error('[PhonePe DEBUG] ❌ MISSING CREDENTIALS — merchantId:', merchantId, 'baseUrl:', baseUrl);
      throw new Error('PhonePe credentials not configured in environment.');
    }

    if (!SALT_KEY()) {
      console.error('[PhonePe DEBUG] ❌ SALT_KEY is missing or empty!');
      throw new Error('PHONEPE_SALT_KEY is not set in environment.');
    }

    // Amount MUST be in paise (₹1 = 100 paise), and MUST be an integer
    const amountInPaise = Math.round(amountInRupees * 100);

    console.log('[PhonePe DEBUG] ── Amount Conversion ──');
    console.log('[PhonePe DEBUG] Input (rupees):', amountInRupees, '| Type:', typeof amountInRupees);
    console.log('[PhonePe DEBUG] Output (paise):', amountInPaise);

    if (amountInPaise <= 0 || isNaN(amountInPaise)) {
      console.error('[PhonePe DEBUG] ❌ INVALID AMOUNT — paise:', amountInPaise, '| original:', amountInRupees);
      throw new Error(`Invalid amount: ${amountInRupees} rupees → ${amountInPaise} paise`);
    }

    // Build the payment request payload
    const payload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: `MUID-${merchantTransactionId}`,
      amount: amountInPaise,
      redirectUrl: redirectUrl,
      redirectMode: 'GET',
      callbackUrl: callbackUrl,
      mobileNumber: userPhone || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    console.log('[PhonePe DEBUG] ── Payload (before Base64) ──');
    console.log('[PhonePe DEBUG]', JSON.stringify(payload, null, 2));

    // Validate merchantTransactionId
    console.log('[PhonePe DEBUG] ── Transaction ID Check ──');
    console.log('[PhonePe DEBUG] merchantTransactionId:', merchantTransactionId);
    console.log('[PhonePe DEBUG] Length:', merchantTransactionId.length, '(max 38)');
    console.log('[PhonePe DEBUG] Is alphanumeric+dash+underscore:', /^[a-zA-Z0-9_-]+$/.test(merchantTransactionId));

    if (merchantTransactionId.length > 38) {
      console.error('[PhonePe DEBUG] ❌ Transaction ID too long!', merchantTransactionId.length);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(merchantTransactionId)) {
      console.error('[PhonePe DEBUG] ❌ Transaction ID has invalid characters!');
    }

    // Base64 encode the payload
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    console.log('[PhonePe DEBUG] Base64 Payload (first 80 chars):', base64Payload.substring(0, 80) + '...');

    // Generate checksum for /pg/v1/pay
    const checksum = generateChecksum(base64Payload, '/pg/v1/pay');

    // Build the full request
    const fullUrl = `${baseUrl}/pg/v1/pay`;
    const requestBody = JSON.stringify({ request: base64Payload });
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
    };

    console.log('[PhonePe DEBUG] ── Full Request ──');
    console.log('[PhonePe DEBUG] URL:', fullUrl);
    console.log('[PhonePe DEBUG] Method: POST');
    console.log('[PhonePe DEBUG] Headers:', JSON.stringify(requestHeaders, null, 2));
    console.log('[PhonePe DEBUG] Body length:', requestBody.length, 'bytes');

    // POST to PhonePe
    console.log('[PhonePe DEBUG] Sending request to PhonePe...');
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
    });

    console.log('[PhonePe DEBUG] ── Raw Response ──');
    console.log('[PhonePe DEBUG] HTTP Status:', response.status, response.statusText);
    console.log('[PhonePe DEBUG] Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    const data = await response.json();

    console.log('[PhonePe DEBUG] ── Response Body ──');
    console.log('[PhonePe DEBUG]', JSON.stringify(data, null, 2));

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      const paymentUrl = data.data.instrumentResponse.redirectInfo.url;
      console.log('[PhonePe DEBUG] ✅ SUCCESS — Payment URL:', paymentUrl);
      return { success: true, paymentUrl };
    }

    console.error('[PhonePe DEBUG] ❌ FAILED — PhonePe rejected the request');
    console.error('[PhonePe DEBUG] Code:', data.code);
    console.error('[PhonePe DEBUG] Message:', data.message);
    return {
      success: false,
      error: data.message || data.code || 'PhonePe returned an unexpected response.',
    };

  } catch (error) {
    console.error('[PhonePe DEBUG] ❌ EXCEPTION:', error.message);
    console.error('[PhonePe DEBUG] Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Verify a payment status with PhonePe (server-side).
 * Always verify server-side — never trust frontend payment status.
 */
export async function verifyPayment(merchantTransactionId) {
  try {
    const merchantId = MERCHANT_ID();
    const baseUrl = BASE_URL();

    if (!merchantId || !baseUrl) {
      throw new Error('PhonePe credentials not configured in environment.');
    }

    const apiEndpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const checksum = generateStatusChecksum(apiEndpoint);

    console.log('[PhonePe] Verifying payment status for:', merchantTransactionId);
    console.log('[PhonePe] Status URL:', `${baseUrl}${apiEndpoint}`);

    const response = await fetch(`${baseUrl}${apiEndpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
      },
    });

    const data = await response.json();
    console.log('[PhonePe] Status response:', JSON.stringify(data));

    if (data.success && data.code === 'PAYMENT_SUCCESS') {
      console.log('[PhonePe] ✅ Payment VERIFIED as SUCCESS');
      return {
        success: true,
        status: 'SUCCESS',
        data: data.data,
        transactionId: data.data?.transactionId || '',
        paymentInstrument: data.data?.paymentInstrument || {},
      };
    }

    if (data.code === 'PAYMENT_PENDING') {
      console.log('[PhonePe] ⏳ Payment is still PENDING');
      return { success: false, status: 'PENDING', data: data.data };
    }

    console.warn('[PhonePe] ❌ Payment verification result:', data.code, data.message);
    return {
      success: false,
      status: data.code || 'FAILED',
      error: data.message || 'Payment was not successful.',
      data: data.data,
    };

  } catch (error) {
    console.error('[PhonePe] verifyPayment error:', error.message);
    return { success: false, status: 'ERROR', error: error.message };
  }
}

/**
 * Verify the X-VERIFY header from a PhonePe webhook callback.
 */
export function verifyWebhookChecksum(base64Response, xVerifyHeader) {
  try {
    const saltKey = SALT_KEY();
    const saltIndex = SALT_INDEX();

    const stringToHash = base64Response + '/pg/v1/pay' + saltKey;
    const expectedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const expectedChecksum = expectedHash + '###' + saltIndex;

    const isValid = expectedChecksum === xVerifyHeader;
    console.log('[PhonePe] Webhook checksum valid:', isValid);
    return isValid;
  } catch (error) {
    console.error('[PhonePe] Webhook checksum verification error:', error.message);
    return false;
  }
}
