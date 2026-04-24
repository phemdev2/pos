'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = await login(email, password);
    if (err) setError(err);
    else router.push('/pos');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg">P</div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Log into your POS system</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition">Login</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">Don't have an account? <a href="/register" className="text-purple-600 font-bold hover:underline">Register Company</a></p>
      </div>
    </div>
  );
}