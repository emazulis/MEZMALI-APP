// app/api/admin/tasks/create/route.js
import clientPromise from '@/lib/mongodb'
import { ObjectId }   from 'mongodb'

export async function POST(req) {
  try {
    const {
      title,
      client,
      dueAt,
      assignees = [],
      highPriority = false,
      note,
      assignedBy
    } = await req.json()

    // 1) validate assignedBy
    if (!assignedBy || !ObjectId.isValid(assignedBy)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing assignedBy ID' }),
        { status: 400, headers: { 'Content-Type':'application/json' } }
      )
    }

    // 2) validate assignees list
    if (
      !Array.isArray(assignees) ||
      assignees.some((id) => !ObjectId.isValid(id))
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid assignees list' }),
        { status: 400, headers: { 'Content-Type':'application/json' } }
      )
    }

    // 3) optional dueAt parsing
    let dueAtDate = null
    if (dueAt) {
      const dt = new Date(dueAt)
      if (isNaN(dt.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Invalid dueAt date' }),
          { status: 400, headers: { 'Content-Type':'application/json' } }
        )
      }
      dueAtDate = dt
    }

    // 4) connect to DB
    const clientConn = await clientPromise
    const db         = clientConn.db('employee-time-tracker')

    // 5) build the task document
    const now = new Date()
    const taskDoc = {
      title:        title        || null,
      client:       client       || null,
      assignedBy:   new ObjectId(assignedBy),
      assignedAt:   now,
      dueAt:        dueAtDate,
      assignees:    assignees.map(id => new ObjectId(id)),
      highPriority: Boolean(highPriority),
      note:         note         || null,
      status:       'in-progress',
      createdAt:    now,
      completedAt:  null
    }

    // 6) insert into Mongo
    const result = await db.collection('tasks').insertOne(taskDoc)

    // 7) respond back
    return new Response(
      JSON.stringify({
        success: true,
        taskId:  result.insertedId
      }),
      {
        status: 201,
        headers: { 'Content-Type':'application/json' }
      }
    )
  } catch (err) {
    console.error('[admin/tasks/create]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type':'application/json' } }
    )
  }
}
