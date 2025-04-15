import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  try {
    // Validate request content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return Response.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const { userId, action } = await req.json();
    
    // Validate required fields
    if (!userId || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("employee-time-tracker");
    const now = new Date();

    if (action === 'clock-in') {
      // Close any existing active sessions
      await db.collection('timeEntries').updateMany(
        { userId, status: 'active' },
        { $set: { status: 'abandoned', endTime: now } }
      );
      
      // Create new session
      const result = await db.collection('timeEntries').insertOne({
        userId,
        startTime: now,
        endTime: null,
        status: 'active'
      });
      
      return Response.json({ 
        success: true,
        sessionId: result.insertedId 
      });

    } else if (action === 'clock-out') {
      const activeEntry = await db.collection('timeEntries').findOne({
        userId, 
        status: 'active'
      });

      if (!activeEntry) {
        return Response.json({ error: 'No active session found' }, { status: 400 });
      }

      const duration = Math.floor((now - activeEntry.startTime) / 1000);
      
      await db.collection('timeEntries').updateOne(
        { _id: activeEntry._id },
        { $set: { 
          endTime: now,
          status: 'completed',
          duration 
        }}
      );
      
      return Response.json({ 
        success: true,
        duration 
      });

    } else if (action === 'get-sessions') {
      const sessions = await db.collection('timeEntries')
        .find({ userId })
        .sort({ startTime: -1 })
        .limit(10)
        .toArray();
      
      return Response.json({ sessions });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (e) {
    console.error('API Error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}