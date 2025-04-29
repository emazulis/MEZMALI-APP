// app/api/admin/tasks/update/route.js
import clientPromise from '@/lib/mongodb'
import { ObjectId }   from 'mongodb'

export async function POST(req) {
  try {
    // 1) parse & validate
    const { id, status } = await req.json()

    if (
      !id ||
      !ObjectId.isValid(id) ||
      !['in-progress', 'completed'].includes(status)
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid id or status' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 2) get a Mongo connection
    const client = await clientPromise
    const db     = client.db('employee-time-tracker')

    // 3) update the task document
    const result = await db
      .collection('tasks')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status,
            // when marking completed, record the timestamp
            completedAt: status === 'completed' ? new Date() : null
          }
        }
      )

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 4) success
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    console.error('[admin/tasks/update]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
