import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Message from '@/models/Message';

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) return NextResponse.json([], { status: 200 }); // Fallback graceful if no DB
    
    const messages = await Message.find().sort({ createdAt: -1 });
    
    // Format to match old local payload style
    const mapped = messages.map(m => ({
      id: m.customId,
      name: m.name,
      email: m.email,
      text: m.text,
      status: m.status,
      date: m.createdAt
    }));
    
    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const db = await connectToDatabase();
    if (!db) return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    
    const body = await req.json();
    
    const newMsg = await Message.create({
      customId: body.id,
      name: body.name,
      email: body.email,
      text: body.text,
      status: body.status || 'unread'
    });
    
    return NextResponse.json({ success: true, message: newMsg }, { status: 201 });
  } catch (error) {
    console.error("Message DB Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const db = await connectToDatabase();
    if (!db) return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const { status } = await req.json();
    
    await Message.findOneAndUpdate({ customId: id }, { status });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const db = await connectToDatabase();
    if (!db) return NextResponse.json({ error: 'Database disconnected' }, { status: 503 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    await Message.findOneAndDelete({ customId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
