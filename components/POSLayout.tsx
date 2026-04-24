'use client';
import { useEffect, useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useAuthStore } from '@/store/useAuthStore';
import CartSidebar from './CartSidebar';
import ProductGrid from './ProductGrid';
import VariantModal from './VariantModal';
import ReceiptModal from './ReceiptModal';
import ProductCrudModal from './ProductCrudModal';
import UserDropdown from './UserDropdown';

export default function POSLayout() {
  const mobileView = usePosStore((s) => s.mobileView);
  const setMobileView = usePosStore((s) => s.setMobileView);
  const sessions = usePosStore((s) => s.sessions);
  const activeTab = usePosStore((s) => s.activeTab);
  const queue = usePosStore((s) => s.queue); 
  const processQueue = usePosStore((s) => s.processQueue); 
  const [syncing, setSyncing] = useState(false);
  const profile = useAuthStore((s) => s.profile);
const isAdmin = profile?.role === 'admin';
  const cartCount = Object.keys(sessions[activeTab]?.items || {}).length;

  
    useEffect(() => {
    if (queue.length === 0) return;

    const interval = setInterval(() => {
      const currentQueue = usePosStore.getState().queue;
      if (currentQueue.length > 0) {
        // processQueue is now async and handles its own syncing state!
        usePosStore.getState().processQueue();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [queue.length]);

  return (
    <div className="bg-slate-100 font-sans text-gray-800 h-[100dvh] overflow-hidden flex flex-col select-none">
      {/* TOP NAV */}
      <nav className="bg-slate-900 text-white h-14 md:h-12 flex-none z-50 shadow-md flex justify-between items-center px-3 md:px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-bold text-lg">P</div>
          <span className="font-bold text-lg hidden lg:block">Next.js POS</span>
        {isAdmin && (
  <button onClick={() => usePosStore.getState().openCrudModal()} className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 transition-all">
    <i className="fas fa-box"></i> Manage Products
  </button>
)}

{isAdmin && (
  <a href="/admin" className="hidden md:flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-600 transition-all">
    <i className="fas fa-users-cog"></i> Staff
  </a>
)}
          <div className="flex md:hidden bg-slate-800 p-1 rounded-lg ml-1">
            <button onClick={() => setMobileView('products')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${mobileView === 'products' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>Items</button>
            <button onClick={() => setMobileView('cart')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${mobileView === 'cart' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>
              Cart {cartCount > 0 && <span className="w-1.5 h-1.5 ml-1 rounded-full bg-red-500 inline-block"></span>}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* NEW: Offline Queue Indicator */}
          {queue.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold cursor-pointer" title={`${queue.length} orders pending sync`}>
              <i className={`fas fa-sync ${syncing ? 'fa-spin' : ''}`}></i>
              <span>{queue.length}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></div>
            <span className="hidden md:inline text-gray-300 text-xs">Online</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border border-slate-600">          <UserDropdown />
</div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        {/* CART */}
        <div className={`bg-white border-r border-gray-200 shadow-xl z-40 flex flex-col h-full w-full md:w-[420px] ${mobileView === 'cart' ? 'absolute inset-0 translate-x-0' : 'hidden md:flex relative md:translate-x-0'}`}>
          <CartSidebar />
        </div>

        {/* PRODUCTS */}
        <div className={`flex-1 flex flex-col bg-slate-100 overflow-hidden w-full ${mobileView === 'cart' ? 'hidden md:flex' : 'flex'}`}>
          <ProductGrid />
        </div>
      </div>

      {/* MODALS */}
      <VariantModal />
      <ReceiptModal /> 
       <ProductCrudModal />
    </div>
  );
}