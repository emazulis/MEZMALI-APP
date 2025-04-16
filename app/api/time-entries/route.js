import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    console.log('[API] Request received at:', new Date().toISOString());
    
    // Validate request content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[API] Invalid content type:', contentType);
      return Response.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const requestData = await req.json();
    console.log('[API] Request data:', JSON.stringify(requestData, null, 2));
    
    const { userId, action, breakId, page = 1, limit = 50 } = requestData;
    
    // Validate required fields
    if (!userId || !action) {
      console.error('[API] Missing required fields:', { userId, action });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("employee-time-tracker");
    const now = new Date();
    console.log('[API] Server time:', now.toISOString());

    if (action === 'clock-in') {
      console.log('[API] Handling clock-in for user:', userId);
      
      // Close any existing active sessions
      const abandonResult = await db.collection('timeEntries').updateMany(
        { userId, status: 'active' },
        { $set: { status: 'abandoned', endTime: now } }
      );
      console.log('[API] Abandoned sessions:', abandonResult.modifiedCount);
      
      // Create new session
      const newSession = {
        userId,
        startTime: now,
        endTime: null,
        status: 'active',
        breaks: [],
        createdAt: new Date()
      };
      const result = await db.collection('timeEntries').insertOne(newSession);
      console.log('[API] New session created:', result.insertedId);
      
      return Response.json({ 
        success: true,
        sessionId: result.insertedId 
      });
    } 
    else if (action === 'clock-out') {
      console.log('[API] Handling clock-out for user:', userId);
      
      const activeEntry = await db.collection('timeEntries').findOne({
        userId, 
        status: 'active'
      });

      if (!activeEntry) {
        console.error('[API] No active session found');
        return Response.json({ error: 'No active session found' }, { status: 400 });
      }

      const duration = Math.floor((now - activeEntry.startTime) / 1000);
      console.log('[API] Session duration:', duration, 'seconds');
      
      await db.collection('timeEntries').updateOne(
        { _id: activeEntry._id },
        { $set: { 
          endTime: now,
          status: 'completed',
          duration,
          updatedAt: new Date()
        }}
      );
      
      return Response.json({ 
        success: true,
        duration 
      });
    } 
    else if (action === 'get-sessions') {
      console.log('[API] Fetching sessions for user:', userId, 'Page:', page, 'Limit:', limit);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get total count for pagination
      const totalCount = await db.collection('timeEntries').countDocuments({
        userId,
        startTime: { $gte: thirtyDaysAgo }
      });
      
      const sessions = await db.collection('timeEntries')
        .find({ 
          userId,
          startTime: { $gte: thirtyDaysAgo }
        })
        .sort({ startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      console.log('[API] Found', sessions.length, 'of', totalCount, 'sessions');
      console.log('[API] Date range:', thirtyDaysAgo.toISOString(), 'to', new Date().toISOString());
      
      return Response.json({ 
        sessions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } 
    else if (action === 'start-break') {
      console.log('[API] Starting break for user:', userId);
      
      const activeEntry = await db.collection('timeEntries').findOne({
        userId,
        status: 'active'
      });
      
      if (!activeEntry) {
        console.error('[API] No active session found');
        return Response.json({ error: 'No active session' }, { status: 400 });
      }

      const breakId = new ObjectId();
      const breakStart = new Date();
      
      await db.collection('timeEntries').updateOne(
        { _id: activeEntry._id },
        { 
          $set: { 
            status: 'on-break',
            currentBreakId: breakId,
            currentBreakStart: breakStart,
            updatedAt: new Date()
          }
        }
      );
      
      return Response.json({ 
        success: true, 
        breakId: breakId.toString(),
        startTime: breakStart.toISOString()
      });
    } 
    else if (action === 'end-break') {
      console.log('[API] Ending break for user:', userId);
      
      const entryOnBreak = await db.collection('timeEntries').findOne({
        userId,
        status: 'on-break'
      });
      
      if (!entryOnBreak || !entryOnBreak.currentBreakStart) {
        console.error('[API] Invalid break state');
        return Response.json({ error: 'Not currently on break' }, { status: 400 });
      }

      const breakEnd = new Date();
      const breakDuration = Math.floor((breakEnd - entryOnBreak.currentBreakStart) / 1000);
      
      await db.collection('timeEntries').updateOne(
        { _id: entryOnBreak._id },
        { 
          $set: { status: 'active', updatedAt: new Date() },
          $push: { 
            breaks: {
              _id: entryOnBreak.currentBreakId || new ObjectId(breakId),
              startTime: entryOnBreak.currentBreakStart,
              endTime: breakEnd,
              duration: breakDuration
            }
          },
          $unset: {
            currentBreakId: "",
            currentBreakStart: ""
          }
        }
      );
      
      return Response.json({ 
        success: true, 
        duration: breakDuration,
        endTime: breakEnd.toISOString()
      });
    } 
    else {
      console.error('[API] Invalid action:', action);
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e) {
    console.error('[API] Error:', e);
    return Response.json({ 
      error: 'Internal server error',
      details: e.message 
    }, { status: 500 });
  }
}