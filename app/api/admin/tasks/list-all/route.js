// app/api/admin/tasks/list-all/route.js
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db     = client.db('employee-time-tracker')

    const tasks = await db
      .collection('tasks')
      .find({})
      .sort({ assignedAt: -1 })
      .toArray()

    return new Response(JSON.stringify({ tasks }), {
      status: 200,
      headers: { 'Content-Type':'application/json' }
    })
  } catch (err) {
    console.error('[admin/tasks/list-all]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type':'application/json' }
    })
  }
}
