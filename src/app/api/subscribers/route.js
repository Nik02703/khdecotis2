import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Subscriber from '@/models/Subscriber';

/**
 * GET — Fetch all subscribers (for admin dashboard)
 */
export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ subscribers: [] });
    }

    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 }).limit(500);
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json({ subscribers: [] });
  }
}

/**
 * POST — Subscribe a new email to the newsletter
 * Body: { email: "user@example.com" }
 */
export async function POST(req) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
    }

    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Re-subscribe
        existing.status = 'active';
        await existing.save();
        return NextResponse.json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
      }
      return NextResponse.json({ success: true, message: 'You are already subscribed!' });
    }

    await Subscriber.create({ email: email.toLowerCase().trim() });
    return NextResponse.json({ success: true, message: 'Successfully subscribed to the newsletter!' }, { status: 201 });
  } catch (error) {
    console.error('Subscriber POST error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: true, message: 'You are already subscribed!' });
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

/**
 * DELETE — Remove a subscriber (admin action)
 * Query: ?id=<subscriber_id>
 */
export async function DELETE(req) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required.' }, { status: 400 });
    }

    await Subscriber.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscriber DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
