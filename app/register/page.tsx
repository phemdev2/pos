'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [form, setForm] = useState({ company: '', branch: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const registerCompany = useAuthStore((s) => s.registerCompany);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = await registerCompany(form.company, form.branch, form.name, form.email, form.password);
    if (err) setError(err);
    else router.push('/pos');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Setup Company</h1>
        <p className="text-gray-500 text-sm mb-6">Create your company and primary branch.</p>
        
        <form onSubmit={handleRegister} className="space-y-3">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
          
          <div className="border-t pt-3 mt-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Company Name</label>
            <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Acme Pharma" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Primary Branch Name</label>
            <input type="text" required value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Main Store" />
          </div>
          <div className="border-t pt-3 mt-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Admin Full Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>

          <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition mt-4">Create System</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">Already have one? <a href="/login" className="text-purple-600 font-bold hover:underline">Login</a></p>
      </div>
    </div>
  );
}