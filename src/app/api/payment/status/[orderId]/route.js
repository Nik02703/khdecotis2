import { NextResponse } from 'next/server';

/**
 * GET /api/payment/status/:orderId
 * 
 * Dummy endpoint requested for testing/setup.
 * Logs the request and returns a 200 OK.
 */
export async function GET(req, { params }) {
  const { orderId } = await params;
  
  console.log(`[PhonePe Dummy API] GET /api/payment/status/${orderId} called.`);
  console.log(`[PhonePe Dummy API] No auth validation performed as requested.`);

  return NextResponse.json({ 
    success: true, 
    status: "pending" 
  }, { status: 200 });
}
