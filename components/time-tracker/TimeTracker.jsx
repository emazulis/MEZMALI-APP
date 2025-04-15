'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function TimeTracker({ userId, onSessionUpdate }) {
  const [clockedIn, setClockedIn] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            action: 'get-sessions' 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check session status');
        }

        const data = await response.json();
        const activeSession = data.sessions?.find(s => s.status === 'active');
        
        if (activeSession) {
          setClockedIn(true);
          const seconds = Math.floor((new Date() - new Date(activeSession.startTime)) / 1000);
          setSessionSeconds(seconds);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkActiveSession();
  }, [userId]);

  const handleClock = async () => {
    setIsLoading(true);
    try {
      const action = clockedIn ? 'clock-out' : 'clock-in';
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          action 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      if (action === 'clock-in') {
        setSessionSeconds(0);
        toast.success('Clocked in successfully!', { id: 'clock-status' });
      } else {
        toast.success(`Clocked out. Session: ${formatTime(sessionSeconds)}`, { id: 'clock-status' });
      }
      
      setClockedIn(!clockedIn);
      // Remove the toast from onSessionUpdate callback in parent component
      onSessionUpdate?.(); // Keep this for data refresh but remove any toast there
    } catch (error) {
      toast.error(error.message, { id: 'clock-status' });
    } finally {
      setIsLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (clockedIn) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn]);

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
          <p className="text-blue-800 font-semibold">
            Current Session: {formatTime(sessionSeconds)}
          </p>
        </div>
      )}

      <button
        onClick={handleClock}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded text-white font-medium ${
          clockedIn 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-green-600 hover:bg-green-700'
        } disabled:opacity-70`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : clockedIn ? 'Clock Out' : 'Clock In'}
      </button>
    </div>
  );
}