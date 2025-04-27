// app/api/login/route.js
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, pin } = body;

    const client = await clientPromise;
    const db     = client.db('employee-time-tracker');
    let user;

    if (pin) {
    user = await db.collection('users').findOne({ pin });
      if (!user) {
              return Response.json({ error: 'Invalid PIN' }, { status: 401 });
      }
    } else {
      // ───── email/password login ────────────────────────────
      if (!email || !password) {
        return Response.json(
          { error: 'Email and password required' },
          { status: 400 }
        );
      }
      user = await db.collection('users').findOne({ email });
      if (!user) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // ───── success: strip out the DB hash, but keep PIN+timestamp ──
    const { password: _, ...rest } = user;
    const userData = {
      ...rest,
      pin: rest.pin,
      pinCreatedAt: rest.pinCreatedAt
    };

    return Response.json({ user: userData });
  } catch (e) {
    console.error('[API][login] Error:', e);
    return Response.json(
      { error: 'Server error: ' + e.message },
      { status: 500 }
    );
  }
}
