import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Order from '@/models/Order'; // Assuming we create this model later
import { decrementOrderStock } from '@/lib/stock';

export async function GET() {
  try {
    const db = await connectToDatabase();
    
    if (!db) {
      return NextResponse.json([]);
    }
    
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200).allowDiskUse(true);
    
    if (orders.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(orders);
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Never crash the UI on a DB error
    return NextResponse.json([{ _id: 'ERR-500', user: { name: 'System Local' }, totalAmount: 0, status: 'Processing', createdAt: new Date() }], { status: 200 });
  }
}

export async function POST(req) {
  try {
    const db = await connectToDatabase();
    if (!db) {
       return NextResponse.json({ error: 'Database disconnected. Order not synced to DB.' }, { status: 503 });
    }
    
    const body = await req.json();
    
    // Perform server-side PIN -> state -> district validation before saving
    const { postcode, state, district } = body.shippingDetails || {};
    if (postcode && /^\d{6}$/.test(postcode)) {
      try {
        const pinRes = await fetch(`https://api.postalpincode.in/pincode/${postcode}`);
        if (pinRes.ok) {
          const pinData = await pinRes.json();
          if (Array.isArray(pinData) && pinData[0]?.Status === 'Success' && Array.isArray(pinData[0]?.PostOffice)) {
            const apiDistricts = pinData[0].PostOffice.map(po => po.District).filter(Boolean);
            const apiStates = pinData[0].PostOffice.map(po => po.State).filter(Boolean);
            
            if (district && apiDistricts.length > 0) {
              const normDist = district.toLowerCase().replace(/[^a-z0-9]/g, '');
              const matchDist = apiDistricts.some(d => {
                const normApi = d.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normApi.includes(normDist) || normDist.includes(normApi);
              });
              if (!matchDist) {
                return NextResponse.json({ error: `PIN code ${postcode} belongs to ${apiDistricts[0]} district, not ${district}.` }, { status: 400 });
              }
            }

            if (state && apiStates.length > 0) {
              const normState = state.toLowerCase().replace(/[^a-z0-9]/g, '');
              const matchState = apiStates.some(s => {
                const normApi = s.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normApi.includes(normState) || normState.includes(normApi);
              });
              if (!matchState) {
                return NextResponse.json({ error: `PIN code ${postcode} belongs to ${apiStates[0]} state, not ${state}.` }, { status: 400 });
              }
            }
          }
        }
      } catch (pinErr) {
        console.warn('Backend PIN verification skip due to external API warning:', pinErr);
      }
    }

    // Upsert robust Order document to prevent duplicate entries/race conditions
    const newOrder = await Order.findOneAndUpdate(

      { orderId: body.id },
      {
        $set: {
          name: body.name,
          email: body.email,
          items: body.items,
          payload: body.payload || [],
          totalAmount: typeof body.total === 'string' ? parseFloat(body.total.replace(/[^0-9.]/g, '')) : (body.total || 0),
          totalString: body.total,
          status: body.status || 'Pending',
          color: body.color,
          text: body.text,
          dateString: body.date,
          shippingDetails: body.shippingDetails || {},
          paymentMethod: body.paymentMethod || 'COD',
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    if (newOrder.paymentMethod === 'COD') {
      await decrementOrderStock(newOrder);
    }
    
    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error("Order DB Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH — Update an existing order's status in MongoDB
 * Uses updateMany to handle duplicate orderId entries
 * Body: { orderId: '#KHD-1234', status: 'Shipped', color: '#dbeafe', text: '#2563eb' }
 */
export async function PATCH(req) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database disconnected.' }, { status: 503 });
    }

    const body = await req.json();
    const { orderId, status, color, text } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required.' }, { status: 400 });
    }

    console.log('[Orders PATCH] Updating ALL docs for orderId:', orderId, '->', status);

    // Update ALL matching documents (handles duplicates)
    const result = await Order.updateMany(
      { orderId },
      { status, color, text }
    );

    if (result.matchedCount === 0) {
      console.error('[Orders PATCH] Order NOT FOUND for orderId:', orderId);
      return NextResponse.json({ error: `Order ${orderId} not found in database.` }, { status: 404 });
    }

    console.log('[Orders PATCH] ✅ Updated', result.modifiedCount, 'of', result.matchedCount, 'docs for:', orderId);
    return NextResponse.json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) {
    console.error('Order PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
