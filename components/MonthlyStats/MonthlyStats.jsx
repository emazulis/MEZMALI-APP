'use client';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const MonthlyStats = ({ userId }) => {
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonthlyDuration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          action: 'get-monthly-duration'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }

      const data = await response.json();
      
      // Debug log to verify the data
      console.log('Monthly duration data:', data);
      
      if (typeof data.totalDuration !== 'number') {
        throw new Error('Invalid data format received');
      }
      
      setTotalDuration(data.totalDuration);
    } catch (err) {
      console.error('Error fetching monthly duration:', err);
      setError(err.message);
      toast.error('Failed to load monthly stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMonthlyDuration();
      
      // Optional: Refresh data every minute
      const interval = setInterval(fetchMonthlyDuration, 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Option 1: Show hours and minutes (102h 17m)
    return `${hrs}h ${mins}m`;
    
    // Option 2: Show precise time (102h 17m 1s)
    // return `${hrs}h ${mins}m ${secs}s`;
    
    // Option 3: Decimal hours (102.28h)
    // return `${(seconds/3600).toFixed(2)}h`;
    
    // Option 4: Days + hours (4d 6h 17m)
    // const days = Math.floor(hrs / 24);
    // return `${days}d ${hrs%24}h ${mins}m`;
  };

  return (
    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-900">
          {new Date().toLocaleString('default', { month: 'long' })} Total Work
        </h4>
        <button 
          onClick={fetchMonthlyDuration}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm py-2">
          {error} - <button 
            onClick={fetchMonthlyDuration} 
            className="text-indigo-600 underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-indigo-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div>
            <p className="text-2xl font-bold text-indigo-700">
              {formatDuration(totalDuration)}
            </p>
            <p className="text-xs text-gray-500">
              Since {new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyStats;