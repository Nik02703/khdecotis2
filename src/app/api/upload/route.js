import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Upload the base64 image/video to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'khdecotis_products',
      resource_type: 'auto', // Handles both images and videos
    });

    return NextResponse.json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload media to Cloudinary', details: error.message || error.toString() }, { status: 500 });
  }
}
