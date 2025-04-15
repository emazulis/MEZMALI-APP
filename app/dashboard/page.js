'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';

const TimeTrackerDynamic = dynamic(
  () => import('@/components/time-tracker/TimeTracker'),
  { 
    loading: () => <div>Loading time tracker...</div>,
    ssr: false 
  }
);

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData) {
      router.push('/login');
    } else {
      setUser(userData);
      setLoading(false);
      fetchSessions(userData._id);
    }
  }, [router]);

  const fetchSessions = async (userId) => {
    try {
      setEntriesLoading(true);
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      setEntriesLoading(false);
    }
  };

  const handleSessionUpdate = () => {
    fetchSessions(user._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const lastSession = completedSessions[0] || null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Employee Dashboard
            </h1>
            <p className="text-gray-800">
              Welcome back, <span className="font-semibold">{user.username}</span>
            </p>
          </div>
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Time Tracking
            </h2>
            
            {TimeTrackerDynamic ? (
              <TimeTrackerDynamic 
                userId={user._id} 
                onSessionUpdate={handleSessionUpdate}
              />
            ) : (
              <div className="text-red-600">
                TimeTracker component failed to load. Please refresh.
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Your Time Sessions
              </h3>
              
              {entriesLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSession && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-gray-900">Current Session</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-sm text-gray-700">Clock In:</p>
                          <p className="font-medium text-gray-900">
                            {new Date(activeSession.startTime).toLocaleString([], {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Status:</p>
                          <p className="font-medium text-green-600">ACTIVE</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {lastSession ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-gray-900">Last Session</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-sm text-gray-700">Clock In:</p>
                          <p className="font-medium text-gray-900">
                            {new Date(lastSession.startTime).toLocaleString([], {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Clock Out:</p>
                          <p className="font-medium text-gray-900">
                            {lastSession.endTime ? 
                              new Date(lastSession.endTime).toLocaleString([], {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-700">Duration:</p>
                          <p className="font-medium text-gray-900">
                            {lastSession.duration ? 
                              `${Math.floor(lastSession.duration / 3600)}h ${Math.floor((lastSession.duration % 3600) / 60)}m` : 
                              'Not calculated'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700">No previous sessions found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Your Profile
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700">Username</p>
                <p className="font-medium text-gray-900">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Member Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}