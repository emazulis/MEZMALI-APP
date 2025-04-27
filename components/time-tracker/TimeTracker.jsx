'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function TimeTracker({ userId, onSessionUpdate }) {
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [netWorkSeconds, setNetWorkSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const breakStartRef = useRef(null);
  const sessionStartRef = useRef(null);
  // Initialize lastUpdateRef with current time to avoid drift
  const lastUpdateRef = useRef(Date.now());

  // Initialize session from API
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'get-sessions' }),
        });
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const { sessions } = await res.json();
        const active = sessions.find(s => s.status === 'active' || s.status === 'on-break');
        if (!active) return;
  
        const now = Date.now();
        // --- calculate total break seconds so far ---
        const totalBreakSeconds = (active.breaks || []).reduce(
          (sum, b) => sum + (b.duration || 0),
          0
        );
  
        // establish your baseline
        sessionStartRef.current = new Date(active.startTime).getTime();
        lastUpdateRef.current   = now;
  
        // compute how many seconds have elapsed since clock-in, minus breaks
        const rawElapsed = Math.floor((now - sessionStartRef.current) / 1000);
        setNetWorkSeconds(rawElapsed - totalBreakSeconds);
  
        if (active.status === 'on-break') {
          // if they’re already on a break, set up break timer too
          breakStartRef.current = new Date(active.currentBreakStart).getTime();
          setBreakSeconds(Math.floor((now - breakStartRef.current) / 1000));
          setOnBreak(true);
        }
  
        setClockedIn(true);
      } catch (err) {
        console.error('Session check error:', err);
      }
    };
  
    checkActiveSession();
  }, [userId]);
  

  // Handle clock in/out
  const handleClock = async () => {
    setIsLoading(true);
    try {
      if (clockedIn) {
        // Clocking out: send net and break durations
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            action: 'clock-out',
            netDuration: netWorkSeconds,
            breakDuration: breakSeconds,
          }),
        });
        if (response.ok) {
          toast.success(
            `Clocked out. Worked: ${formatTime(netWorkSeconds)}`
          );
        }
      } else {
        // Clocking in
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'clock-in' }),
        });
        if (response.ok) {
          sessionStartRef.current = Date.now();
          lastUpdateRef.current = sessionStartRef.current;
          toast.success('Clocked in successfully!');
        }
      }

      if (!clockedIn) {
        setNetWorkSeconds(0);
        setBreakSeconds(0);
      }
      setClockedIn(!clockedIn);
      setOnBreak(false);
      onSessionUpdate?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle break start/end
  const handleBreak = async (action) => {
    setIsLoading(true);
    try {
      if (action === 'start') {
        breakStartRef.current = Date.now();
        setOnBreak(true);
      } else {
        const breakDuration = Math.floor(
          (Date.now() - breakStartRef.current) / 1000
        );
        setBreakSeconds((prev) => prev + breakDuration);
        setOnBreak(false);
      }

      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: action === 'start' ? 'start-break' : 'end-break',
          breakStart:
            action === 'start' ? new Date().toISOString() : undefined,
        }),
      });

      if (response.ok) {
        toast.success(
          `Break ${action === 'start' ? 'started' : 'ended'}`
        );
        onSessionUpdate?.();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer for net work time with drift fix
  useEffect(() => {
    let interval;
    if (clockedIn && !onBreak) {
      lastUpdateRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        // Use rounding to avoid missing seconds due to intervals firing early
        const elapsed = Math.round(
          (now - lastUpdateRef.current) / 1000
        );
        lastUpdateRef.current = now;
        setNetWorkSeconds((prev) => prev + elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, onBreak]);

  // Timer for break time
  useEffect(() => {
    let interval;
    if (onBreak) {
      breakStartRef.current = Date.now();
      interval = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <p className="font-medium text-gray-900">Employee ID: {userId}</p>

      {clockedIn && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-600">Worked:</p>
              <p className="text-xl font-bold text-blue-800">
                {formatTime(netWorkSeconds)}
              </p>
            </div>
            {onBreak && (
              <div>
                <p className="text-sm text-yellow-600">Current Break:</p>
                <p className="text-xl font-bold text-yellow-800">
                  {formatTime(breakSeconds)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            {onBreak ? (
              <button
                onClick={() => handleBreak('end')}
                className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded"
              >
                End Break
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleBreak('start')}
                  className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                >
                  Take Break
                </button>
                <button
                  onClick={handleClock}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  Clock Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!clockedIn && (
        <button
          onClick={handleClock}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Clock In'}
        </button>
      )}
    </div>
  );
}
