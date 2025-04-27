import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  console.error('MongoDB connection error: Missing MONGODB_URI');
  throw new Error('Missing MONGODB_URI');
}

try {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      console.log('Creating new MongoDB client for development');
      client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 50
      });
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    console.log('Creating new MongoDB client for production');
    client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50
    });
    clientPromise = client.connect();
  }

  // Add connection verification
  clientPromise.then(() => {
    console.log('MongoDB connected successfully');
  }).catch(err => {
    console.error('MongoDB connection failed:', err);
  });

} catch (err) {
  console.error('MongoDB initialization error:', err);
  throw err;
}

export default clientPromise;