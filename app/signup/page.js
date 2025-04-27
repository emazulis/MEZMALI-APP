'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link          from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username:       '',
    email:          '',
    password:       '',
    confirmPassword:'',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  // update form fields
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  // on submit, call /api/signup and show PIN
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // basic client-side validation
    const { username, email, password, confirmPassword } = formData;
    if (!username || !email || !password) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // show the generated PIN (valid 7 days)
      alert(
        `🎉 Your account has been created!\n` +
        `Your 4-digit PIN is: ${data.pin}\n\n` +
        `Save it somewhere safe—it's valid for 7 days.`
      );

      // clear form & navigate to login
      setFormData({
        username:       '',
        email:          '',
        password:       '',
        confirmPassword:'',
      });
      router.push('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        {error && (
          <div className="mb-4 p-2 text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
