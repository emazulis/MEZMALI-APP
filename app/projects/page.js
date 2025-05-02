// app/projects/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter }          from 'next/navigation'
import Link                   from 'next/link'
import { toast }              from 'react-hot-toast'

export default function PastProjectsPage() {
  const router = useRouter()
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('currentUser')
    if (!stored) {
      router.push('/login')
      return
    }
    const { _id: userId } = JSON.parse(stored)

    setLoading(true)
    fetch('/api/admin/tasks/past', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId })
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`)
        return res.json()
      })
      .then(data => setTasks(data.tasks || []))
      .catch(err => {
        console.error('Failed to load past projects:', err)
        toast.error(err.message)
      })
      .finally(() => setLoading(false))
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Past Projects</h1>
          <Link href="/dashboard">
            <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              ← Back
            </button>
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"/>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            You have no completed projects.
          </div>
        ) : (
          <ul className="space-y-4">
            {tasks.map(t => {
              const assigned  = new Date(t.assignedAt)
              const completed = new Date(t.completedAt)
              const msDelta   = completed - assigned
              const days      = Math.floor(msDelta / 86_400_000)
              const hours     = Math.floor((msDelta % 86_400_000) / 3_600_000)
              const took      = days > 0 ? `${days}d ${hours}h` : `${hours}h`

              return (
                <li
                  key={t._id}
                  className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row justify-between border-l-4 border-green-400"
                >
                  <div className="flex-1 space-y-2">
                    <p className="text-lg font-medium">{t.title || 'Untitled Task'}</p>
                    <div className="flex flex-wrap text-sm text-gray-600 gap-4">
                      <span>Assigned: {assigned.toLocaleDateString()}</span>
                      <span>Turned in: {completed.toLocaleDateString()}</span>
                      <span>Took: {took}</span>
                      {t.client && <span>Client: {t.client}</span>}
                    </div>
                    {t.note && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 hover:underline">
                          View Note
                        </summary>
                        <p className="mt-1 text-gray-800 whitespace-pre-wrap">
                          {t.note}
                        </p>
                      </details>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      Completed
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
