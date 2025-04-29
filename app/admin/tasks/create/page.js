'use client';

import { useState, useEffect } from 'react';
import { useRouter }          from 'next/navigation';
import Link                   from 'next/link';
import { toast }              from 'react-hot-toast';

export default function CreateTaskPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title:        '',
    client:       '',
    dueAt:        '',
    assignees:    [],
    highPriority: false,
    note:         '',
  });
  const [employees, setEmployees] = useState([]);

  // load employees for assignment dropdown
  useEffect(() => {
    fetch('/api/admin/employees')
      .then(r => r.json())
      .then(d => setEmployees(d.employees || []))
      .catch(() => toast.error('Could not load employees'));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, selectedOptions } = e.target;
    if (name === 'assignees') {
      setForm(f => ({
        ...f,
        assignees: Array.from(selectedOptions).map(o => o.value)
      }));
    } else if (type === 'checkbox' && name === 'highPriority') {
      setForm(f => ({ ...f, highPriority: checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // pull current admin user from localStorage
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
      toast.error('Not logged in');
      return router.push('/login');
    }
    const me = JSON.parse(stored);

    // build the payload from your form state, plus assignedBy
    const payload = {
      title:        form.title || null,
      client:       form.client || null,
      dueAt:        form.dueAt ? new Date(form.dueAt).toISOString() : null,
      assignees:    form.assignees,
      highPriority: form.highPriority,
      note:         form.note || null,
      assignedBy:   me._id                    // ← new field
    };

    try {
      const res = await fetch('/api/admin/tasks/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      // check before parsing JSON
      if (!res.ok) {
        const text = await res.text();
        console.error('Create task failed:', text);
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      toast.success('Task created');
      router.push('/admin/employees');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Assign New Task</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task title (optional)"
              className="mt-1 w-full border rounded p-2"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium">Client</label>
            <input
              name="client"
              value={form.client}
              onChange={handleChange}
              placeholder="Client name (optional)"
              className="mt-1 w-full border rounded p-2"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <input
              type="date"
              name="dueAt"
              value={form.dueAt}
              onChange={handleChange}
              className="mt-1 w-full border rounded p-2"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="highPriority"
              checked={form.highPriority}
              onChange={handleChange}
              id="highPriority"
              className="h-4 w-4"
            />
            <label htmlFor="highPriority" className="text-sm font-medium">
              High Priority
            </label>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium">Note</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Add a note (optional)"
              className="mt-1 w-full border rounded p-2"
              rows={3}
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium">Assign To (Ctrl+Click multi)</label>
            <select
              name="assignees"
              multiple
              value={form.assignees}
              onChange={handleChange}
              className="mt-1 w-full border rounded p-2 h-32"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.username}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
