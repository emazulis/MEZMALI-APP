import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const client = await clientPromise;
    const db = client.db("employee-time-tracker");

    // Find user by email
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    return Response.json({ user: userData });
    
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}