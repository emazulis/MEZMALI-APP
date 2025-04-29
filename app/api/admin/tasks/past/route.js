// app/api/admin/tasks/past/route.js
import clientPromise from '@/lib/mongodb'
import { ObjectId }   from 'mongodb'

export async function POST(req) {
  try {
    // 1) parse & validate
    const { userId } = await req.json()
    if (!userId || !ObjectId.isValid(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing userId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 2) connect
    const client = await clientPromise
    const db     = client.db('employee-time-tracker')

    // 3) fetch all completed tasks for this user
    const tasks = await db
      .collection('tasks')
      .find({
        assignees:   new ObjectId(userId),
        status:      'completed'
      })
      .sort({ completedAt: -1 })
      .toArray()

    // 4) return them
    return new Response(
      JSON.stringify({ tasks }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (err) {
    console.error('[admin/tasks/past]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
