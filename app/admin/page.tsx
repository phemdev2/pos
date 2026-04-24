'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();
  
  // Data State
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ALL HOOKS MUST BE UP HERE ---

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.company_id) {
      fetchStaff();
    }
  }, [profile]);

  // --- FUNCTIONS ---

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_company_staff', { 
      comp_id: profile?.company_id 
    });
    if (!error && data) {
      setStaff(data);
    } else {
      console.error("Failed to fetch staff:", error);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); 
    setFormSuccess('');
    setIsSubmitting(true);

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        email, 
        password, 
        role, 
        companyId: profile?.company_id 
      })
    });

        let data;
    try {
      data = await res.json();
    } catch (e) {
      setFormError("Failed to connect to server.");
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(false);

    if (!res.ok) {
      setFormError(data.error || "An unknown error occurred");
    } else {
      setFormSuccess(`Successfully added ${name}!`);
      // Reset form
      setName(''); 
      setEmail(''); 
      setPassword(''); 
      setRole('staff');
      // Refresh list
      fetchStaff();
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchStaff();
  };

  // --- EARLY RETURNS GO DOWN HERE, AFTER ALL HOOKS ---

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading session...</div>;
  }
  
  const userRole = (profile.role || '').toLowerCase();
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-10 rounded-xl shadow border max-w-sm">
          <i className="fas fa-shield-halved text-red-500 text-4xl mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">Only administrators can manage staff.</p>
          <button onClick={() => router.push('/pos')} className="w-full bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-900">
            <i className="fas fa-arrow-left mr-2"></i> Back to POS
          </button>
        </div>
      </div>
    );
  }

  // --- NORMAL UI RENDER ---

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-500 text-sm mt-1">Create users and assign roles for your company.</p>
          </div>
          <button onClick={() => router.push('/pos')} className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm border shadow-sm">
            <i className="fas fa-arrow-left mr-2"></i> Back to POS
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* LEFT: Create User Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6 h-fit">
            <h2 className="font-bold text-lg mb-4 border-b pb-2 text-gray-800">Add New Staff</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              
              {formError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                  <i className="fas fa-exclamation-circle mt-0.5"></i>
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
                  <i className="fas fa-check-circle mt-0.5"></i>
                  <span>{formSuccess}</span>
                </div>
              )}
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input required value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email / Username</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Assigned Role</label>
                <select value={role} onChange={e=>setRole(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white">
                  <option value="staff">Staff (Cashier Access Only)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting || !profile?.company_id}
                className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><i className="fas fa-spinner fa-spin"></i> Creating...</>
                ) : (
                  <><i className="fas fa-user-plus"></i> Create User</>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: Staff List Table */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-4 border-b pb-2 text-gray-800">Current Staff ({staff.length})</h2>
            
            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading staff members...</p>
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fas fa-users text-4xl mb-2 opacity-50"></i>
                <p>No staff members found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {staff.map((s) => (
                      <tr key={s.id} className="py-4 hover:bg-gray-50">
                        <td className="font-medium text-gray-800">{s.full_name}</td>
                        <td className="text-gray-500">{s.email}</td>
                        <td>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {s.role?.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-right">
                          {s.id !== profile.id ? (
                            <select 
                              value={s.role} 
                              onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                              className="border border-gray-200 rounded-lg p-1.5 text-xs bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                            >
                              <option value="staff">Set as Staff</option>
                              <option value="admin">Set as Admin</option>
                            </select>
                          ) : (
                            <span className="text-xs text-purple-600 italic font-medium bg-purple-50 px-2 py-1 rounded">Current User</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}