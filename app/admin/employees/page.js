'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Menu states
  const [openMenu, setOpenMenu] = useState(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);

  // Username edit
  const [editingUsernameId, setEditingUsernameId] = useState(null);
  const [newUsername, setNewUsername] = useState('');

  // Format a duration in seconds to Hh Mm
  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return router.push('/login');
    const me = JSON.parse(stored);
    if (me.role !== 'admin') return router.push('/');
    setUser(me);
  }, [router]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees');
      let data = {};
      try {
        data = await res.json();
      } catch {
        // Non-JSON response
      }
      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch employees: ${res.status}`);
      }
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEmployees();
  }, [user]);

  useEffect(() => {
    const onClick = (e) => {
      if (
        !e.target.closest('.menu-button') &&
        !e.target.closest('.menu-options') &&
        !e.target.closest('.edit-field') &&
        !e.target.closest('.status-button') &&
        !e.target.closest('.status-options')
      ) {
        setOpenMenu(null);
        setOpenStatusMenu(null);
        setEditingUsernameId(null);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const handleRemove = async (empId) => {
    if (!confirm('Permanently delete this employee?')) return;
    try {
      const res = await fetch(`/api/admin/employees/${empId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Employee removed');
      setEmployees(employees.filter(e => e.id !== empId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleViewDetails = (empId) => router.push(`/admin/employees/${empId}`);

  const handleEditUsername = async (empId) => {
    if (!newUsername.trim()) return toast.error('Username cannot be empty');
    try {
      const res = await fetch(`/api/admin/employees/${empId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Username updated');
      fetchEmployees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditingUsernameId(null);
      setNewUsername('');
    }
  };

  const handleStatusAction = (emp, action) => async () => {
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: emp.id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${action.replace('-', ' ')} successful`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOpenStatusMenu(null);
    }
  };

  if (!user) return null;

  // Stats including on-break
  const totalCount = employees.length;
  const clockedInCount = employees.filter(e => e.status === 'active' || e.status === 'on-break').length;
  const onBreakCount = employees.filter(e => e.status === 'on-break').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <div className="flex gap-2">
            {/* logout */}
            <button
              onClick={() => {
                localStorage.removeItem('currentUser');
                router.push('/login');
              }}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>

            {/* back to Admin Console */}
            <Link href="/dashboard">
              <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition">
                ← Back
              </button>
            </Link>

            <Link href="/admin/tasks">
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Tasks
              </button>
            </Link>

            {/* NEW: assign task */}
            <Link href="/admin/tasks/create">
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Assign Task
              </button>
            </Link>
          </div>
        </header>

        {!loading && (
          <div className="grid grid-cols-3 gap-6 bg-white p-4 rounded-xl shadow text-center">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-xl font-semibold">{totalCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Clocked In Now</p>
              <p className="text-xl font-semibold">{clockedInCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">On Break</p>
              <p className="text-xl font-semibold">{onBreakCount}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full" />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2">Username</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50 relative">
                    <td className="px-4 py-2">
                      {editingUsernameId === emp.id ? (
                        <div className="flex items-center gap-2 edit-field">
                          <input
                            type="text"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            className="border rounded p-1 text-sm"
                          />
                          <button
                            onClick={() => handleEditUsername(emp.id)}
                            className="text-green-600 text-sm"
                          >Save</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {emp.username}
                          <button
                            onClick={e => { e.stopPropagation(); setEditingUsernameId(editingUsernameId === emp.id ? null : emp.id); setNewUsername(emp.username); }}
                            className="text-gray-400 hover:text-gray-600 edit-field"
                          >🖉</button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 relative">
                      <div className="flex items-center gap-2">
                        <span className={
                          emp.status === 'off' ? 'text-red-600' :
                          emp.status === 'active' ? 'text-green-600' :
                          'text-yellow-600'
                        }>
                          {{ off:'Off', active:'At Work', 'on-break':'On Break' }[emp.status]}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); setOpenStatusMenu(openStatusMenu === emp.id ? null : emp.id); }}
                          className="text-gray-400 hover:text-gray-600 status-button"
                        >🖉</button>
                      </div>
                      {openStatusMenu === emp.id && (
                        <div className="status-options absolute bg-white border shadow rounded z-10 mt-1 top-full left-20">
                          {emp.status === 'off' && (
                            <button
                              onClick={handleStatusAction(emp, 'clock-in')}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >Clock In</button>
                          )}
                          {emp.status === 'active' && (
                            <>
                              <button
                                onClick={handleStatusAction(emp, 'start-break')}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >Start Break</button>
                              <button
                                onClick={handleStatusAction(emp, 'clock-out')}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >Clock Out</button>
                            </>
                          )}
                          {emp.status === 'on-break' && (
                            <button
                              onClick={handleStatusAction(emp, 'end-break')}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >End Break</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === emp.id ? null : emp.id); }}
                        className="menu-button text-gray-400 hover:text-gray-600"
                      >⋮</button>
                      {openMenu === emp.id && (
                        <div className="menu-options absolute bg-white border shadow rounded right-4 mt-2 z-10">
                          <button
                            onClick={() => handleRemove(emp.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >Remove</button>
                          <button
                            onClick={() => handleViewDetails(emp.id)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >View Details</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
