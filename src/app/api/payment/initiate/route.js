import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order';
import { initiatePhonePePayment } from '@/lib/phonepe';

/**
 * POST /api/payment/initiate
 * 
 * Called from the checkout page when user selects "Pay Now".
 * 1. Saves or finds the order in MongoDB with paymentStatus: "pending"
 * 2. Calls PhonePe V1 to get a PAY_PAGE URL
 * 3. Returns the redirectUrl to the frontend for redirect
 * 
 * Expected body: { orderId, amount, userPhone, userEmail, userName }
 */
export async function POST(req) {
  console.log('[Initiate] ══════════════════════════════════════');
  console.log('[Initiate] POST /api/payment/initiate called');
  console.log('[Initiate] ══════════════════════════════════════');

  try {
    // Step 1: Database connection
    console.log('[Initiate] Step 1: Connecting to database...');
    const db = await connectToDatabase();
    if (!db) {
      console.error('[Initiate] ❌ Database connection failed!');
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 503 }
      );
    }
    console.log('[Initiate] ✅ Database connected');

    // Step 2: Parse request body
    const body = await req.json();
    console.log('[Initiate] Step 2: Request body received:');
    console.log('[Initiate]   orderId:', body.orderId);
    console.log('[Initiate]   amount:', body.amount, '| type:', typeof body.amount);
    console.log('[Initiate]   userPhone:', body.userPhone);

    const { orderId, amount, userPhone, userEmail, userName } = body;

    if (!orderId || !amount) {
      console.error('[Initiate] ❌ Missing required fields — orderId:', orderId, 'amount:', amount);
      return NextResponse.json(
        { error: 'Missing required fields: orderId and amount.' },
        { status: 400 }
      );
    }

    // Step 3: Parse and validate amount
    let numericAmount = amount;
    if (typeof amount === 'string') {
      numericAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    }

    console.log('[Initiate] Step 3: Amount parsing:');
    console.log('[Initiate]   Raw input:', amount, '| Parsed:', numericAmount);
    console.log('[Initiate]   Will become paise:', Math.round(numericAmount * 100));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('[Initiate] ❌ INVALID AMOUNT after parsing:', numericAmount);
      return NextResponse.json(
        { error: 'Invalid amount provided.' },
        { status: 400 }
      );
    }

    // Step 4: Call PhonePe V1 initiatePayment
    console.log('[Initiate] Step 4: Calling PhonePe V1 initiatePhonePePayment()...');
    const result = await initiatePhonePePayment(
      orderId,
      numericAmount,
      userPhone || '9999999999',
      userEmail || 'guest'
    );

    console.log('[Initiate] Step 5: PhonePe result:');
    console.log('[Initiate]   success:', result.success);
    console.log('[Initiate]   redirectUrl:', result.redirectUrl || 'NONE');
    console.log('[Initiate]   transactionId:', result.transactionId || 'NONE');
    console.log('[Initiate]   error:', result.error || 'NONE');

    if (!result.success || !result.redirectUrl) {
      console.error('[Initiate] ❌ PhonePe initiation FAILED:', result.error);
      return NextResponse.json(
        { error: `PhonePe API Error: ${result.error || 'No redirect URL returned'}` },
        { status: 502 }
      );
    }

    // Step 6: Lock the transactionId into the order in MongoDB
    console.log('[Initiate] Step 6: Saving transactionId to database...');
    await Order.findOneAndUpdate(
      { orderId: orderId },
      {
        $set: {
          merchantTransactionId: result.transactionId,
          paymentStatus: 'pending',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    console.log('[Initiate] ✅ Order locked in DB with transactionId:', result.transactionId);

    console.log('[Initiate] ✅ SUCCESS — Returning redirect URL to frontend');
    return NextResponse.json({
      success: true,
      paymentUrl: result.redirectUrl,
      merchantTransactionId: result.transactionId,
    });

  } catch (error) {
    console.error('[Initiate] ❌ UNHANDLED EXCEPTION:', error.message);
    console.error('[Initiate] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error during payment initiation.' },
      { status: 500 }
    );
  }
}
