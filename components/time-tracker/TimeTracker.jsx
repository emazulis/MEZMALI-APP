'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function TimeTracker({ userId, onSessionUpdate }) {
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const breakStartRef = useRef(null);
  const sessionStartRef = useRef(null);

  // Initialize session from API
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'get-sessions' }),
        });

        if (response.ok) {
          const data = await response.json();
          const activeSession = data.sessions?.find(s => s.status === 'active' || s.status === 'on-break');
          
          if (activeSession) {
            const now = Date.now();
            const sessionStart = new Date(activeSession.startTime).getTime();
            sessionStartRef.current = sessionStart;
            setSessionSeconds(Math.floor((now - sessionStart) / 1000));
            
            if (activeSession.status === 'on-break') {
              breakStartRef.current = new Date(activeSession.breakStart).getTime();
              setBreakSeconds(Math.floor((now - breakStartRef.current) / 1000));
              setOnBreak(true);
            }
            setClockedIn(true);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    checkActiveSession();
  }, [userId]);

  // Handle clock in/out
  const handleClock = async () => {
    setIsLoading(true);
    try {
      const action = clockedIn ? 'clock-out' : 'clock-in';
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      if (response.ok) {
        if (action === 'clock-in') {
          sessionStartRef.current = Date.now();
          setSessionSeconds(0);
          setBreakSeconds(0);
          toast.success('Clocked in successfully!');
        } else {
          toast.success(`Clocked out. Session: ${formatTime(sessionSeconds)}`);
        }
        setClockedIn(!clockedIn);
        setOnBreak(false);
        onSessionUpdate?.();
      }
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
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: action === 'start' ? 'start-break' : 'end-break' 
        }),
      });

      if (response.ok) {
        if (action === 'start') {
          breakStartRef.current = Date.now();
          setOnBreak(true);
        } else {
          const breakDuration = Math.floor((Date.now() - breakStartRef.current) / 1000);
          setBreakSeconds(prev => prev + breakDuration);
          setOnBreak(false);
        }
        toast.success(`Break ${action === 'start' ? 'started' : 'ended'}`);
        onSessionUpdate?.();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer effects
  useEffect(() => {
    let interval;
    if (clockedIn && !onBreak) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, onBreak]);

  useEffect(() => {
    let interval;
    if (onBreak) {
      interval = setInterval(() => {
        setBreakSeconds(prev => {
          // Only count time since current break started
          const currentBreakTime = breakStartRef.current 
            ? Math.floor((Date.now() - breakStartRef.current) / 1000)
            : 0;
          return prev + currentBreakTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <p className="font-medium text-gray-900">Employee ID: {userId}</p>
      
      {clockedIn && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex-1 pr-4 border-r border-blue-200">
              <p className="text-blue-800 font-semibold">
                Current Session: {formatTime(sessionSeconds)}
              </p>
            </div>
            {onBreak && (
              <div className="flex-1 pl-4">
                <p className="text-yellow-800 font-semibold">
                  Break Duration: {formatTime(
                    breakStartRef.current 
                      ? Math.floor((Date.now() - breakStartRef.current) / 1000)
                      : 0
                  )}
                </p>
              </div>
            )}
          </div>

          {onBreak ? (
            <button
              onClick={() => handleBreak('end')}
              className="w-full mt-3 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              End Break
            </button>
          ) : (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleBreak('start')}
                className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
              >
                Start Break
              </button>
              <button
                onClick={handleClock}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Clock Out
              </button>
            </div>
          )}
        </div>
      )}

      {!clockedIn && (
        <button
          onClick={handleClock}
          className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded"
        >
          Clock In
        </button>
      )}
    </div>
  );
}