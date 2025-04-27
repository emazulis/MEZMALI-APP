import clientPromise from '@/lib/mongodb';
import bcrypt       from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();

    // 1) Required fields
    if (!username || !email || !password) {
      return Response.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      );
    }

    // 2) Ensure unique
    const client = await clientPromise;
    const db     = client.db('employee-time-tracker');
    const existing = await db
      .collection('users')
      .findOne({ $or: [ { username }, { email } ] });
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return Response.json(
        { error: `That ${field} is already taken` },
        { status: 400 }
      );
    }

    // 3) Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 4) Create 4-digit PIN + timestamp
    const pin          = Math.floor(1000 + Math.random() * 9000).toString();
    const pinCreatedAt = new Date();

    // 5) Insert user
    const result = await db.collection('users').insertOne({
      username,
      email,
      password:     hashed,
      pin,
      pinCreatedAt,
      createdAt:    new Date()
    });

    // 6) Return PIN for front-end alert
    return Response.json({
      success: true,
      userId:  result.insertedId,
      pin
    });
  } catch (e) {
    console.error('[API][signup] Error:', e);
    return Response.json(
      { error: 'Server error: ' + e.message },
      { status: 500 }
    );
  }
}
