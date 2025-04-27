'use client';

import { useState, useEffect } from 'react';
import { useRouter }        from 'next/navigation';
import dynamic              from 'next/dynamic';
import { toast }            from 'react-hot-toast';
import Link                 from 'next/link';
import MonthlyStats         from '@/components/MonthlyStats/MonthlyStats';

const TimeTrackerDynamic = dynamic(
  () => import('@/components/time-tracker/TimeTracker'),
  {
    loading: () => <div>Loading time tracker...</div>,
    ssr: false,
  }
);

export default function Dashboard() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser]               = useState(null);
  const [sessions, setSessions]             = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const PIN_LIFESPAN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const [pinRevealed, setPinRevealed] = useState(false);
  const [rotating,  setRotating]      = useState(false);

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  async function regeneratePin() {
    setRotating(true);
    try {
      const res = await fetch('/api/regenerate-pin', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ userId: user._id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      // update local state and localStorage
      const updated = { ...user, pin: data.pin, pinCreatedAt: data.pinCreatedAt };
      setUser(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRotating(false);
    }
  }

  // ─── 5) fetchSessions helper ─────────────────────────────────
  const fetchSessions = async (userId) => {
    setEntriesLoading(true);
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'get-sessions' }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { sessions = [] } = await res.json();
      setSessions(sessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Failed to load sessions');
      setSessions([]);
    } finally {
      setEntriesLoading(false);
    }
  };

  // ─── 6) handleSessionUpdate ──────────────────────────────────
  //    We'll pass this to the time tracker so, on clock-out/break, 
  //    we re-fetch the sessions list.
  const handleSessionUpdate = () => {
    if (user) fetchSessions(user._id);
  };

  // ─── 7) Load user from localStorage ───────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
      router.push('/login');
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch {
      router.push('/login');
      return;
    }
    setUser(parsed);
    setLoadingUser(false);
  }, [router]);

  // ─── 8) Fetch sessions once we know who the user is ──────────
  useEffect(() => {
    if (user) {
      fetchSessions(user._id);
    }
  }, [user]);

  // ─── 9) Early‐return while loading or not logged in ───────────
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full" />
      </div>
    );
  }
  if (!user) {
    router.push('/login');
    return null;
  }

  const pinAgeMs = Date.now() - new Date(user.pinCreatedAt).getTime();
  const showPin  = !!user.pin && pinAgeMs <= PIN_LIFESPAN_MS;

  // ─── 11) Session summaries ────────────────────────────────────
  const activeSession     = sessions.find(s => s.status === 'active' || s.status === 'on-break');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const lastSession       = completedSessions[0] || null;


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

            <TimeTrackerDynamic 
              userId={user._id} 
              onSessionUpdate={handleSessionUpdate}
            />

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
                          <p className={`font-medium ${activeSession.status === 'on-break' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {activeSession.status === 'on-break' ? 'ON BREAK' : 'ACTIVE'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {lastSession ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-gray-900 mb-4">Last Session</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
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
                              <p className="text-sm text-gray-700">Effective Duration:</p>
                              <p className="font-medium text-gray-900">
                                {(() => {
                                  const raw         = lastSession.duration || 0;
                                  const totalBreaks = lastSession.breaks?.reduce(
                                    (sum, b) => sum + (b.duration || 0),
                                    0
                                  ) || 0;
                                  const netSeconds  = Math.max(raw - totalBreaks, 0);
                                  return formatDuration(netSeconds);
                                })()}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
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
                                  }) : 
                                  'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">Break Duration:</p>
                              <p className="font-medium text-gray-900">
                                {(() => {
                                  const totalSeconds = lastSession.breaks?.reduce((total, breakItem) => 
                                    total + (breakItem.duration || 0), 0) || 0;
                                  return formatDuration(totalSeconds);
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <Link 
                          href="/sessions" 
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          View All Sessions
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-gray-700">No previous sessions found</p>
                      </div>
                      <div className="flex justify-center">
                        <Link 
                          href="/sessions" 
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          View All Sessions
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Your Stats
            </h2>
            
            <MonthlyStats userId={user._id} />
            
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Profile
              </h3>
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
              { showPin && (
                  <div className="mt-4">
                  <p className="text-sm text-gray-700">
                    <button
                      onClick={() => setPinRevealed(r => !r)}
                      className="text-blue-600 hover:underline"
                    >
                      Your PIN
                    </button>
                  </p>
                
                  {pinRevealed && (
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="font-mono text-xl tracking-widest text-gray-900">
                        {user.pin}
                      </span>
                      <button
                        onClick={regeneratePin}
                        disabled={rotating}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {rotating ? '…' : 'Generate New PIN'}
                      </button>
                    </div>
                  )}
                </div>
                )}  
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}