'use client';
import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import Link                     from 'next/link';
import toast                     from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // load and check role
  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return router.push('/login');
    const me = JSON.parse(stored);
    if (me.role !== 'admin') return router.push('/');
    setUser(me);
  }, [router]);

  // form state
  const [form, setForm] = useState({ username:'', email:'', password:'' });

  const handleCreate = async e => {
    e.preventDefault();
    const res = await fetch('/api/admin/create', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({ creatorId: user._id, ...form }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    toast.success(`Admin created with PIN ${data.pin}`);
    setForm({ username:'', email:'', password:'' });
  };

  if (!user) return null;
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Console</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={e=>setForm({ ...form, username:e.target.value })}
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e=>setForm({ ...form, email:e.target.value })}
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e=>setForm({ ...form, password:e.target.value })}
          required
          className="w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Admin
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link href="/" className="underline">Back to Dashboard</Link>
      </p>
    </div>
  );
}
