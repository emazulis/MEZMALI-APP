import clientPromise from '@/lib/mongodb';
import bcrypt       from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  const { creatorId, username, email, password } = await req.json();

  // 1) Basic validation
  if (!creatorId || !username || !email || !password) {
    return new Response(
      JSON.stringify({ error: 'Missing fields' }),
      { status: 400, headers: {'Content-Type':'application/json'} }
    );
  }

  // 2) Verify creator is an admin
  const client = await clientPromise;
  const db     = client.db('employee-time-tracker');
  const creator = await db.collection('users').findOne({ _id: new ObjectId(creatorId) });
  if (!creator || creator.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Not authorized' }),
      { status: 403, headers: {'Content-Type':'application/json'} }
    );
  }

  // 3) Check uniqueness
  const dup = await db.collection('users').findOne({
    $or: [{ email }, { username }]
  });
  if (dup) {
    return new Response(
      JSON.stringify({ error: 'Email or username already taken' }),
      { status: 409, headers: {'Content-Type':'application/json'} }
    );
  }

  // 4) Hash & insert
  const hashed = await bcrypt.hash(password, 10);
  const pin    = Math.floor(1000 + Math.random()*9000).toString();
  const now    = new Date();

  const result = await db.collection('users').insertOne({
    username,
    email,
    password: hashed,
    role:     'admin',    // ← new admin
    pin,
    pinCreatedAt: now,
    createdAt:    now
  });

  return new Response(
    JSON.stringify({ success: true, adminId: result.insertedId, pin }),
    { status: 201, headers: {'Content-Type':'application/json'} }
  );
}
