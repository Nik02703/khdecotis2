import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { initiatePayment } from '@/lib/phonepe';

/**
 * POST /api/payment/initiate
 * 
 * Called from the checkout page when user selects "Pay Now".
 * 1. Saves or finds the order in MongoDB with paymentStatus: "pending"
 * 2. Calls PhonePe to get a payment page URL
 * 3. Returns the paymentUrl to the frontend for redirect
 * 
 * Expected body: { orderId, amount, userPhone, userEmail, userName }
 */
export async function POST(req) {
  console.log('[Initiate DEBUG] ══════════════════════════════════════');
  console.log('[Initiate DEBUG] POST /api/payment/initiate called');
  console.log('[Initiate DEBUG] ══════════════════════════════════════');

  try {
    // Step 1: Database connection
    console.log('[Initiate DEBUG] Step 1: Connecting to database...');
    const db = await connectToDatabase();
    if (!db) {
      console.error('[Initiate DEBUG] ❌ Database connection failed!');
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 503 }
      );
    }
    console.log('[Initiate DEBUG] ✅ Database connected');

    // Step 2: Parse request body
    const body = await req.json();
    console.log('[Initiate DEBUG] Step 2: Request body received:');
    console.log('[Initiate DEBUG]   orderId:', body.orderId, '| type:', typeof body.orderId);
    console.log('[Initiate DEBUG]   amount:', body.amount, '| type:', typeof body.amount);
    console.log('[Initiate DEBUG]   userPhone:', body.userPhone);
    console.log('[Initiate DEBUG]   userEmail:', body.userEmail);
    console.log('[Initiate DEBUG]   userName:', body.userName);

    const { orderId, amount, userPhone, userEmail, userName } = body;

    if (!orderId || !amount) {
      console.error('[Initiate DEBUG] ❌ Missing required fields — orderId:', orderId, 'amount:', amount);
      return NextResponse.json(
        { error: 'Missing required fields: orderId and amount.' },
        { status: 400 }
      );
    }

    // Step 3: Build safe merchantTransactionId
    // PhonePe rules: alphanumeric + hyphen + underscore, max 38 chars, must be unique
    const cleanedId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    const cleanTransactionId = `MT${Date.now()}_${cleanedId.slice(-6)}`.slice(0, 38);
    console.log('[Initiate DEBUG] Step 3: Transaction ID built:');
    console.log('[Initiate DEBUG]   Original orderId:', orderId);
    console.log('[Initiate DEBUG]   Cleaned:', cleanedId);
    console.log('[Initiate DEBUG]   Final merchantTransactionId:', cleanTransactionId);
    console.log('[Initiate DEBUG]   Length:', cleanTransactionId.length, '/ 38 max');

    // Step 4: Find and update order in MongoDB
    console.log('[Initiate DEBUG] Step 4: Looking up order in MongoDB...');
    let orderDoc = await Order.findOne({ orderId });
    if (orderDoc) {
      orderDoc.paymentStatus = 'pending';
      orderDoc.merchantTransactionId = cleanTransactionId;
      await orderDoc.save();
      console.log('[Initiate DEBUG] ✅ Order found and updated with merchantTransactionId');
    } else {
      console.warn('[Initiate DEBUG] ⚠️ Order not found in DB yet (may be created by OrderContext):', orderId);
    }

    // Step 5: Build callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/api/payment/callback?merchantTransactionId=${cleanTransactionId}&orderId=${encodeURIComponent(orderId)}`;
    const callbackUrl = `${baseUrl}/api/payment/webhook`;

    console.log('[Initiate DEBUG] Step 5: Callback URLs:');
    console.log('[Initiate DEBUG]   Base URL:', baseUrl);
    console.log('[Initiate DEBUG]   Redirect URL:', redirectUrl);
    console.log('[Initiate DEBUG]   Webhook URL:', callbackUrl);

    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      console.warn('[Initiate DEBUG] ⚠️ WARNING: Base URL is localhost — webhook WILL NOT WORK');
      console.warn('[Initiate DEBUG] The redirect (browser-side) will work fine for testing.');
      console.warn('[Initiate DEBUG] For webhook, use: ngrok http 3000');
    }

    // Step 6: Parse and validate amount
    let numericAmount = amount;
    if (typeof amount === 'string') {
      numericAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    }

    console.log('[Initiate DEBUG] Step 6: Amount parsing:');
    console.log('[Initiate DEBUG]   Raw input:', amount, '| type:', typeof amount);
    console.log('[Initiate DEBUG]   Parsed numeric:', numericAmount);
    console.log('[Initiate DEBUG]   Will become paise:', Math.round(numericAmount * 100));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('[Initiate DEBUG] ❌ INVALID AMOUNT after parsing:', numericAmount);
      return NextResponse.json(
        { error: 'Invalid amount provided.' },
        { status: 400 }
      );
    }

    // Step 7: Call PhonePe
    console.log('[Initiate DEBUG] Step 7: Calling PhonePe initiatePayment()...');
    const result = await initiatePayment(
      cleanTransactionId,
      numericAmount,
      userPhone || '9999999999',
      redirectUrl,
      callbackUrl
    );

    console.log('[Initiate DEBUG] Step 8: PhonePe result:');
    console.log('[Initiate DEBUG]   success:', result.success);
    console.log('[Initiate DEBUG]   paymentUrl:', result.paymentUrl || 'NONE');
    console.log('[Initiate DEBUG]   error:', result.error || 'NONE');

    if (!result.success) {
      console.error('[Initiate DEBUG] ❌ PhonePe initiation FAILED:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to initiate payment with PhonePe.' },
        { status: 502 }
      );
    }

    console.log('[Initiate DEBUG] ✅ SUCCESS — Returning payment URL to frontend');
    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      merchantTransactionId: cleanTransactionId,
    });

  } catch (error) {
    console.error('[Initiate DEBUG] ❌ UNHANDLED EXCEPTION:', error.message);
    console.error('[Initiate DEBUG] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error during payment initiation.' },
      { status: 500 }
    );
  }
}
