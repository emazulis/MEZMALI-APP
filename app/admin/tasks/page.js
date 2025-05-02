'use client'              // ← this is critical so useEffect runs in the browser

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { toast }               from 'react-hot-toast'

export default function AdminTasksPage() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/tasks/list-all')
        if (!res.ok) {
          console.error('Fetch list-all failed:', res.status)
          throw new Error(`Server responded ${res.status}`)
        }
        const { tasks } = await res.json()
        setTasks(tasks || [])
      } catch (err) {
        console.error(err)
        toast.error('Could not load tasks')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Assigned Tasks</h1>
          <Link href="/admin/employees">
            <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              ← Back to Employees
            </button>
          </Link>
        </header>

        <div className="bg-white rounded-xl shadow overflow-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="p-6 text-center text-gray-600">No tasks found.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr className="border-b">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Assigned At</th>
                  <th className="px-4 py-2">Due At</th>
                  <th className="px-4 py-2">Assigned By</th>
                  <th className="px-4 py-2">Assignees</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Completed At</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id} className="border-b hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">{t.title || '—'}</td>
                    <td className="px-4 py-3">
                      {new Date(t.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {/* if you populated assignedByUsername in the DB lookup, show it; otherwise show the raw ID */}
                      {t.assignedByUsername || t.assignedBy}
                    </td>
                    <td className="px-4 py-3">
                      {t.assigneesUsernames?.join(', ') ?? `${t.assignees.length} user(s)`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          t.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {t.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.completedAt
                        ? new Date(t.completedAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
