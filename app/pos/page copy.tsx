'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { usePosStore } from '@/store/usePosStore';
import POSLayout from '@/components/POSLayout';

export default function POSPage() {
  const router = useRouter();
  const { user, profile, branches, activeBranchId, isLoading, fetchProfile, logout } = useAuthStore();
  const fetchProducts = usePosStore((s) => s.fetchProducts);
  const isLoadingProducts = usePosStore((s) => s.isLoadingProducts);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    // If done loading and no user, kick out
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    // If user exists and branch is selected, fetch products FOR THAT BRANCH
    if (user && activeBranchId) {
      fetchProducts(activeBranchId);
    }
  }, [user, isLoading, activeBranchId, fetchProducts, router]);

  // Loading State
  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500 font-bold">Loading Session...</div>;
  
  // Branch Selection Screen (If user has multiple branches)
  if (user && !activeBranchId && branches.length > 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Select Branch</h2>
          <div className="space-y-2">
            {branches.map(b => (
              <button key={b.id} onClick={() => useAuthStore.setState({ activeBranchId: b.id })} className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 font-bold text-gray-700 transition">
                {b.name}
              </button>
            ))}
          </div>
          <button onClick={logout} className="mt-6 text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </div>
    );
  }

  if (isLoadingProducts) return <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500 font-bold flex-col gap-3"><i className="fas fa-spinner fa-spin text-2xl text-purple-600"></i>Syncing Branch...</div>;

  return <POSLayout />;
}