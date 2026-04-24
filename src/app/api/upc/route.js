import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const upc = searchParams.get('upc');

  if (!upc) {
    return NextResponse.json({ error: 'UPC code is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching UPC data:', error);
    return NextResponse.json({ error: 'Failed to fetch from UPC database' }, { status: 500 });
  }
}
