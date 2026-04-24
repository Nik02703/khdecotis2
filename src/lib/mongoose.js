import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// We do NOT throw an error here. We allow graceful fallback if the URI is missing
// so the user's dev server doesn't crash before they supply credentials.
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
      console.error("CRITICAL ERROR: MONGODB_URI is MISSING in Production! Deployment will be restricted to read-only Mock Mode.");
    } else {
      console.warn("MONGODB_URI is not defined in the environment. Falling back to local test data.");
    }
    return null; 
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("MongoDB connection established successfully.");
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB Atlas connection failed: ", e.message);
    return null;
  }
  
  return cached.conn;
}

export default connectToDatabase;
