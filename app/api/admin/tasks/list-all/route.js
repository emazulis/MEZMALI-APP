// app/api/admin/tasks/list-all/route.js
import clientPromise from '@/lib/mongodb'
import { ObjectId }   from 'mongodb'

export async function POST(req) {
  try {
    const { userId } = await req.json()
    if (!ObjectId.isValid(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const client = await clientPromise
    const db     = client.db('employee-time-tracker')

    // fetch *all* tasks (any status) assigned to this user
    const tasks = await db
      .collection('tasks')
      .find({ assignees: new ObjectId(userId) })
      .sort({ assignedAt: -1 })
      .toArray()

    return new Response(JSON.stringify({ tasks }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[admin/tasks/list-all]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
