'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function TimeTracker({ userId, onSessionUpdate }) {
  const [clockedIn, setClockedIn] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [onBreak, setOnBreak] = useState(false);

  // Format the session time in HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start or End Break
  const handleBreak = async (action) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: action === 'start' ? 'start-break' : 'end-break',
        }),
      });

      if (!response.ok) throw new Error('Break action failed');

      if (action === 'start') {
        setOnBreak(true);
        toast.success('Break started');
      } else {
        setOnBreak(false);
        toast.success('Break ended');
      }

      // Refresh data in parent
      onSessionUpdate?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Clock In or Clock Out
  const handleClock = async () => {
    setIsLoading(true);
    try {
      const action = clockedIn ? 'clock-out' : 'clock-in';
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      if (action === 'clock-in') {
        setSessionSeconds(0);
        toast.success('Clocked in successfully!');
      } else {
        toast.success(`Clocked out. Session: ${formatTime(sessionSeconds)}`);
      }

      setClockedIn(!clockedIn);
      setOnBreak(false); // Reset break state on new session or after clock out
      onSessionUpdate?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer that **pauses** during break
  useEffect(() => {
    let interval;
    // Only increment if user is clocked in and not on break
    if (clockedIn && !onBreak) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, onBreak]);

  // On mount, check if there is an active or on-break session
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'get-sessions' }),
        });

        if (!response.ok) {
          throw new Error('Failed to check session status');
        }

        const data = await response.json();
        // If there's a session with status "active" or "on-break," treat it as active
        const activeSession = data.sessions?.find(
          (s) => s.status === 'active' || s.status === 'on-break'
        );

        if (activeSession) {
          setClockedIn(true);
          // Calculate how many seconds have elapsed since start
          const elapsed = Math.floor(
            (new Date() - new Date(activeSession.startTime)) / 1000
          );
          setSessionSeconds(elapsed);

          // If session is on break, set onBreak
          if (activeSession.status === 'on-break') {
            setOnBreak(true);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    checkActiveSession();
  }, [userId]);

  return (
    <div className="space-y-4">
      <p className="font-medium text-gray-900">Employee ID: {userId}</p>

      {/* Show a 'live' session display inside the tracker (optional) */}
      {clockedIn && (
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-blue-800 font-semibold">
            Current Session: {formatTime(sessionSeconds)}
          </p>
          <p>Status: {onBreak ? 'On Break' : 'Active'}</p>
        </div>
      )}

      <div className="flex gap-2">
        {/* Only show Clock In if not clocked in */}
        {!clockedIn && (
          <button
            onClick={handleClock}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-70"
          >
            {isLoading ? 'Processing...' : 'Clock In'}
          </button>
        )}

        {/* If clocked in and not on break, show Clock Out & Start Break */}
        {clockedIn && !onBreak && (
          <>
            <button
              onClick={handleClock}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-70"
            >
              {isLoading ? 'Processing...' : 'Clock Out'}
            </button>
            <button
              onClick={() => handleBreak('start')}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded bg-yellow-600 hover:bg-yellow-700 text-white font-medium disabled:opacity-70"
            >
              {isLoading ? 'Processing...' : 'Start Break'}
            </button>
          </>
        )}

        {/* If clocked in but on break, only show End Break button (hide Clock Out) */}
        {clockedIn && onBreak && (
          <button
            onClick={() => handleBreak('end')}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-70"
          >
            {isLoading ? 'Processing...' : 'End Break'}
          </button>
        )}
      </div>
    </div>
  );
}
