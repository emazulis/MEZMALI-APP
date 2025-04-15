import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();
    
    // Validate all fields exist
    if (!username || !email || !password) {
      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3 || username.length > 20) {
      return Response.json(
        { error: "Username must be 3-20 characters" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("employee-time-tracker");

    // Check for existing user BEFORE processing
    const existingUser = await db.collection("users").findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      return Response.json(
        { error: `This ${field} is already in use` },
        { status: 400 }
      );
    }

    // Only hash password if all validations pass
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.collection("users").insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    return Response.json({ 
      success: true,
      userId: result.insertedId 
    });

  } catch (e) {
    return Response.json(
      { error: "Server error: " + e.message },
      { status: 500 }
    );
  }
}