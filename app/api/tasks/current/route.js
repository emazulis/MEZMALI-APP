// app/api/tasks/current/route.js
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

    // 2) connect to Mongo
    const client = await clientPromise
    const db     = client.db('employee-time-tracker')

    // 3) fetch the latest in-progress task for this user
    const task = await db
      .collection('tasks')
      .findOne(
        {
          assignees: new ObjectId(userId),
          status:    'in-progress'
        },
        {
          sort: { assignedAt: -1 }
        }
      )

    // 4) return it (might be null if none found)
    return new Response(
      JSON.stringify({ task }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    console.error('[tasks/current]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
