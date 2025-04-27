// app/api/regenerate-pin/route.js
import clientPromise from '@/lib/mongodb';
import { ObjectId }    from 'mongodb';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type':'application/json' } }
      );
    }
    const client = await clientPromise;
    const db     = client.db('employee-time-tracker');

    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinCreatedAt = new Date();

    const result = await db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { pin, pinCreatedAt } }
      );

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type':'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, pin, pinCreatedAt }),
      { status: 200, headers: { 'Content-Type':'application/json' } }
    );
  } catch (e) {
    console.error('[regenerate-pin error]', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type':'application/json' } }
    );
  }
}
