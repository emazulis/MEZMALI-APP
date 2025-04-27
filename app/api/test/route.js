import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    return Response.json({ status: 200, connected: true });
  } catch (e) {
    return Response.json({ 
      status: 500,
      error: e.message,
      suggestion: "Check: 1) MongoDB Atlas IP whitelist 2) .env.local credentials"
    });
  }
}
