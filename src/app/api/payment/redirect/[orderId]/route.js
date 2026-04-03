import { NextResponse } from 'next/server';

/**
 * POST /api/payment/redirect/:orderId
 * 
 * Dummy endpoint requested for testing/setup.
 * Logs the request and returns a 200 OK.
 */
export async function POST(req, { params }) {
  const { orderId } = await params;
  
  console.log(`[PhonePe Dummy API] POST /api/payment/redirect/${orderId} called.`);
  console.log(`[PhonePe Dummy API] No auth validation performed as requested.`);

  return NextResponse.json({ 
    success: true, 
    message: "redirect endpoint ready" 
  }, { status: 200 });
}
