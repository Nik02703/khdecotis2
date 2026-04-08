import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  // We only run this trap on specific high-risk database mutating paths.
  // Method MUST NOT be GET. We allow public viewing of products, but not creation.
  const isProtectedPath = 
    req.nextUrl.pathname.startsWith('/api/products') || 
    req.nextUrl.pathname.startsWith('/api/coupons') || 
    req.nextUrl.pathname.startsWith('/api/upload') ||
    req.nextUrl.pathname.startsWith('/api/shiprocket/createOrder');

  // Let GET operations pass unhindered (users fetching the catalog)
  if (req.method === 'GET') {
    return NextResponse.next();
  }

  // If it's a mutating request (POST, PATCH, DELETE) to a protected path
  if (isProtectedPath) {
    const token = req.cookies.get('khd_admin_token')?.value;

    if (!token) {
      console.warn(`[Security] 🚫 Blocked unauthorized ${req.method} attempt to ${req.nextUrl.pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized Access. Strict Admin privileges required.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    try {
      // Very securely parses the token inside the Edge runtime using 'jose'
      await jwtVerify(token, secretKey);
      return NextResponse.next();
    } catch (error) {
      console.error(`[Security] ❌ Forged/Expired Token intercepted at ${req.nextUrl.pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Token Expired or Invalid.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// Config to specify which routes should be intercepted by the middleware
export const config = {
  matcher: ['/api/products/:path*', '/api/coupons/:path*', '/api/upload', '/api/shiprocket/createOrder'],
};
