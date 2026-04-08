import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@khdecotis.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KHDadmin!2024';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!JWT_SECRET) {
       return NextResponse.json({ error: 'Server key error' }, { status: 500 });
    }

    // Create a 24-hour expiring JWT
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ role: 'admin', email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secretKey);

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Lock the token into an HttpOnly cookie so JS cannot steal it
    response.cookies.set('khd_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
