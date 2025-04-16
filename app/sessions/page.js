'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SessionsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    if (!userData) {
      router.push('/login');
    } else {
      setUser(userData);
      fetchSessions(userData._id);
    }
  }, [router]);

  const formatBreakTime = (timeString) => {
    if (!timeString) return 'Not recorded';
    
    try {
      const time = new Date(timeString);
      if (isNaN(time.getTime())) return 'Invalid time';
      
      return time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting break time:', error);
      return 'Error';
    }
  };

  const fetchSessions = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          action: 'get-sessions'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load session data');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBreakDetails = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // Filter sessions from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSessions = sessions.filter(s => 
    s.status === 'completed' && 
    new Date(s.startTime) >= thirtyDaysAgo
  ).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Previous Sessions (Last 30 Days)
            </h1>
            <p className="text-gray-800">
              Viewing sessions for <span className="font-semibold">{user.username}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Dashboard
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('currentUser');
                router.push('/login');
              }}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              Logout
            </button>
          </div>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {recentSessions.length > 0 ? (
                <>
                  <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Clock In</div>
                    <div className="col-span-2">Clock Out</div>
                    <div className="col-span-2">Duration</div>
                    <div className="col-span-2">Total Break Time</div>
                    <div className="col-span-2">Break Count</div>
                  </div>

                  {recentSessions.map((session) => {
                    const totalBreakSeconds = session.breaks?.reduce((total, breakItem) => 
                      total + (breakItem.duration || 0), 0) || 0;
                    const totalBreakTime = `${Math.floor(totalBreakSeconds / 3600)}h ${Math.floor((totalBreakSeconds % 3600) / 60)}m`;
                    
                    return (
                      <div key={session._id} className="space-y-2">
                        <div className="grid grid-cols-12 gap-4 py-4 border-b border-gray-200 last:border-0 text-sm items-center">
                          <div className="col-span-2">
                            {new Date(session.startTime).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>

                          <div className="col-span-2">
                            {new Date(session.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>

                          <div className="col-span-2">
                            {session.endTime ? 
                              new Date(session.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 
                              'N/A'}
                          </div>

                          <div className="col-span-2">
                            {session.duration ? 
                              `${Math.floor(session.duration / 3600)}h ${Math.floor((session.duration % 3600) / 60)}m` : 
                              '0h 0m'}
                          </div>

                          <div className="col-span-2">
                            {totalBreakTime}
                          </div>

                          <div className="col-span-2 flex items-center justify-between">
                            <span>{session.breaks?.length || 0}</span>
                            {session.breaks?.length > 0 && (
                              <button 
                                onClick={() => toggleBreakDetails(session._id)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                {expandedSession === session._id ? 'Hide' : 'Show'} details
                              </button>
                            )}
                          </div>
                        </div>

                        {expandedSession === session._id && session.breaks?.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 className="font-medium mb-3 text-sm">Break Details</h4>
                            <div className="space-y-3">
                                {session.breaks.map((breakItem, index) => {
                                // Calculate duration if not provided
                                let duration = breakItem.duration;
                                if (!duration && breakItem.startTime && breakItem.endTime) {
                                    const start = new Date(breakItem.startTime);
                                    const end = new Date(breakItem.endTime);
                                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                    duration = (end - start) / 1000; // Convert to seconds
                                    }
                                }

                                return (
                                    <div key={index} className="text-sm grid grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-gray-500">Start: </span>
                                        {formatBreakTime(breakItem.startTime)}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">End: </span>
                                        {formatBreakTime(breakItem.endTime)}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Duration: </span>
                                        {duration ? 
                                        `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m` : 
                                        '0h 0m'}
                                    </div>
                                    </div>
                                );
                                })}
                            </div>
                            </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-700">No sessions found in the last 30 days</p>
                  <Link 
                    href="/dashboard" 
                    className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}