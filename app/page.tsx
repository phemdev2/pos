// app/page.tsx
'use client';

import { useEffect } from 'react';
import { usePosStore } from '@/store/usePosStore';
import POSLayout from '@/components/POSLayout';

export default function POSPage() {
  const fetchProducts = usePosStore((s) => s.fetchProducts);
  const isLoadingProducts = usePosStore((s) => s.isLoadingProducts);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (isLoadingProducts) return (
    <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500 font-bold flex-col gap-3">
      <i className="fas fa-spinner fa-spin text-2xl text-purple-600"></i>
      Syncing with Database...
    </div>
  );

  return <POSLayout />;
}