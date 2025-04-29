'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function PastProjectsPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteOpenId, setNoteOpenId] = useState(null);

  // Fetch all completed tasks for current user
  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return;
    const { _id: userId } = JSON.parse(stored);

    fetch('/api/admin/tasks/list-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.tasks) {
          // only completed tasks
          setTasks(data.tasks.filter(t => t.status === 'completed'));
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load past projects');
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = iso => new Date(iso).toLocaleDateString();

  const calculateDuration = (start, end) => {
    const ms = new Date(end) - new Date(start);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days < 1) return 'under 1 day';
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Past Projects</h1>
          <Link href="/dashboard">
            <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">← Back</button>
          </Link>
        </header>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-gray-600">No past projects found.</p>
          ) : (
            tasks.map(task => (
              <div key={task._id} className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-green-400">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
                  <div>
                    <p className="text-lg font-medium text-gray-900">{task.title || 'Untitled Task'}</p>
                    <p className="text-sm text-gray-600">
                      Assigned: {formatDate(task.assignedAt)}
                      {' • '}Turned in: {formatDate(task.completedAt)}
                    </p>
                    <p className="text-sm text-gray-600">Duration: {calculateDuration(task.assignedAt, task.completedAt)}</p>
                    {task.client && <p className="text-sm text-gray-600">Client: {task.client}</p>}
                    {task.assignedBy && <p className="text-sm text-gray-600">Assigned by: {task.assignedBy}</p>}
                  </div>
                  <div className="flex justify-end items-start">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span>
                  </div>
                </div>
                {task.note && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setNoteOpenId(open => open === task._id ? null : task._id)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {noteOpenId === task._id ? 'Hide Note' : 'View Note'}
                    </button>
                    {noteOpenId === task._id && (
                      <div className="mt-2 p-3 bg-gray-50 rounded">
                        <p className="text-gray-800 text-sm whitespace-pre-wrap">{task.note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
