'use client';

import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import Link                     from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  // state
  const [pin,      setPin]      = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  // keypad handlers
  const addDigit  = d => pin.length < 4 && setPin(pin + d);
  const backspace = () => setPin(pin.slice(0, -1));
  const clearAll  = () => setPin('');

  // auto-submit PIN when 4 digits entered
  useEffect(() => {
    if (!useEmail && pin.length === 4) {
      (async () => {
        setError('');
        try {
          const res  = await fetch('/api/login', {
            method:  'POST',
            headers: { 'Content-Type':'application/json' },
            body:    JSON.stringify({ pin }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Invalid PIN');
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          router.push('/dashboard');
        } catch (e) {
          setError(e.message);
          // reset so they can try again
          setPin('');
        }
      })();
    }
  }, [pin, useEmail, router]);

  // email login
  const submitEmail = async e => {
    e.preventDefault();
    setError('');
    try {
      const res  = await fetch('/api/login', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-96 p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Employee Login</h1>

        {error && (
          <div className="mb-4 p-2 text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        {!useEmail ? (
          <>
            {/* PIN display */}
            <div className="mb-6 text-2xl font-mono tracking-widest">
              {pin.padEnd(4, '○').split('').map(c => c === '○' ? '○' : '•')}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button
                  key={d}
                  onClick={() => addDigit(d)}
                  className="py-4 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={backspace}
                className="py-4 bg-yellow-200 rounded-lg hover:bg-yellow-300 focus:outline-none"
              >
                ←
              </button>
              <button
                onClick={() => addDigit('0')}
                className="py-4 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none"
              >
                0
              </button>
              <button
                onClick={clearAll}
                className="py-4 bg-red-200 rounded-lg hover:bg-red-300 focus:outline-none"
              >
                C
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitEmail} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Login with Email
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-between text-sm text-gray-600">
          <button
            onClick={() => setUseEmail(u => !u)}
            className="underline hover:text-gray-800"
          >
            {useEmail ? 'Use PIN Login' : 'Use Email Login'}
          </button>
          <Link href="/signup" className="underline hover:text-gray-800">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
