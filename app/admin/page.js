'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('currentUser')
    if (!stored) return router.push('/login')
    const parsed = JSON.parse(stored)
    if (parsed.role !== 'admin') return router.push('/')
    setUser(parsed)
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          {/* Return button */}
          <Link href="/dashboard">
            <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition">
              ← Return to Dashboard
            </button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/create">
            <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">Add Admin</h2>
              <p className="text-gray-600">Create new administrator accounts</p>
            </div>
          </Link>

          <Link href="/admin/employees">
            <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">Employee Overview</h2>
              <p className="text-gray-600">View all employee work stats</p>
            </div>
          </Link>

          <Link href="/admin/tasks">
            <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">Task Management</h2>
              <p className="text-gray-600">Assign and review tasks</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
