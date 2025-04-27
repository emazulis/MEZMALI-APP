import clientPromise from '@/lib/mongodb';
import { ObjectId }  from 'mongodb';

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db     = client.db('employee-time-tracker');

    // load all “user” accounts (including legacy no-role)
    const users = await db
      .collection('users')
      .find({
        $or: [
          { role: 'user' },
          { role: { $exists: false } }
        ]
      })
      .toArray();

    // for each user, grab their open session (if any) and pull its status
    const employees = await Promise.all(
      users.map(async (u) => {
        const session = await db
          .collection('timeEntries')
          .findOne({
            userId: u._id.toString(),
            status: { $in: ['active','on-break'] }
          });

        return {
          id:       u._id.toString(),
          username: u.username,
          email:    u.email,
          status:   session?.status || 'off'   // ← “off”, “active” or “on-break”
        };
      })
    );

    return new Response(JSON.stringify({ employees }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[API][admin/employees] error', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
