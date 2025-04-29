// app/api/tasks/complete/route.js
import clientPromise from '@/lib/mongodb';
import { ObjectId }   from 'mongodb';

export async function POST(req) {
  try {
    const { taskId } = await req.json();
    if (!ObjectId.isValid(taskId)) {
      return new Response(JSON.stringify({ error: 'Invalid taskId' }), { status: 400 });
    }

    const client = await clientPromise;
    const db     = client.db('employee-time-tracker');

    const result = await db
      .collection('tasks')
      .updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { status: 'completed' } }
      );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[tasks/complete]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
