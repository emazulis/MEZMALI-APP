import clientPromise from '@/lib/mongodb'
import { ObjectId }  from 'mongodb'

export async function DELETE(request, { params }) {
  const { id } = params || {}
  if (!id || !ObjectId.isValid(id)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing user ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const client = await clientPromise
    const db     = client.db('employee-time-tracker')

    // 1) Delete the user
    const result = await db
      .collection('users')
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2) Clean up their time entries
    await db
      .collection('timeEntries')
      .deleteMany({ userId: id })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[DELETE /api/admin/employees/[id]]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function PATCH(request, { params }) {
  const { id } = params || {}
  if (!id || !ObjectId.isValid(id)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing user ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { username } = body
  if (typeof username !== 'string' || !username.trim()) {
    return new Response(
      JSON.stringify({ error: 'Username must be a non-empty string' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const client = await clientPromise
    const db     = client.db('employee-time-tracker')

    const result = await db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { username: username.trim() } }
      )

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, username: username.trim() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[PATCH /api/admin/employees/[id]]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
