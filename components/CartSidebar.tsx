'use client';
import { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CURRENCY } from '@/lib/types';
import RefundModal from './RefundModal';
import CreditModal from './CreditModal';

export default function CartSidebar() {
  // Local Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [editablePrices, setEditablePrices] = useState<Record<string, string>>({});

  // POS State
  const sessions = usePosStore((s) => s.sessions);
  const activeTab = usePosStore((s) => s.activeTab);
  const switchTab = usePosStore((s) => s.switchTab);
  const createTab = usePosStore((s) => s.createTab);
  const closeTab = usePosStore((s) => s.closeTab);
  const modItem = usePosStore((s) => s.modItem);
  const clearCart = usePosStore((s) => s.clearCart);
  const processPayment = usePosStore((s) => s.processPayment);

  // Auth State & Role Check
  const profile = useAuthStore((s) => s.profile);
  const userRole = (profile?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  // Helper Functions for Role-Protected Actions
  const handleReturnClick = () => {
    if (!isAdmin) return alert("Access Denied: Only administrators can perform returns.");
    setShowRefundModal(true);
  };

  const handleCreditClick = () => {
    if (!isAdmin) return alert("Access Denied: Only administrators can process credit sales.");
    setShowCreditModal(true);
  };

  // Derived State & Math
  const currentSession = sessions[activeTab];
  const items = Object.values(currentSession?.items || {});
  const count = items.length;
  
  // NEW: Use editable price if available, otherwise fallback to base price
  const rawSubtotal = items.reduce((a, i, key) => {
    const finalPrice = editablePrices[key] ? parseFloat(editablePrices[key] || 0) : i.p;
    return a + (finalPrice * i.qty);
  }, 0);
  
  let discountAmt = 0;
  if (currentSession?.discountType === 'percent') {
    discountAmt = rawSubtotal * ((currentSession?.discount || 0) / 100);
  } else {
    discountAmt = currentSession?.discount || 0;
  }
  const totalVal = Math.round((rawSubtotal - discountAmt + Number.EPSILON) * 100) / 100;

  return (
    <>
      {/* Tabs */}
      <div className="flex bg-gray-50 border-b overflow-x-auto custom-scrollbar h-11 flex-none items-end px-1">
        {Object.entries(sessions).map(([id, session]) => (
          <div key={id} onClick={() => switchTab(id)} className={`px-4 py-2 flex items-center justify-between min-w-[80px] cursor-pointer text-xs font-bold border-r select-none rounded-t-lg mx-1 mb-[-1px] border-t border-l ${activeTab === id ? 'bg-white text-purple-700 border-b-white border-t-purple-600 z-10' : 'bg-gray-100 text-gray-500 border-b-gray-200 hover:bg-gray-50'}`}>
            <span>Order {session.number}</span>
            {Object.keys(sessions).length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); closeTab(id); }} className="ml-2 text-gray-400 hover:text-red-500">&times;</button>
            )}
          </div>
        ))}
        <button onClick={createTab} className="px-3 py-2 text-gray-500 hover:text-purple-600"><i className="fas fa-plus"></i></button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 bg-white border-b shadow-sm flex-none grid grid-cols-2 gap-2">
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-custom-item'))} className="flex items-center justify-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-2 rounded text-xs font-bold border border-indigo-100">
          <i className="fas fa-pen"></i> Misc
        </button>
        <button onClick={handleReturnClick} className="flex items-center justify-center gap-1 bg-gray-50 text-gray-600 hover:bg-red-50 px-2 py-2 rounded text-xs font-bold border border-gray-200">
          <i className="fas fa-undo"></i> Return
        </button>
        <button onClick={clearCart} disabled={count === 0} className="col-span-2 flex items-center justify-center gap-1 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 px-2 py-2 rounded text-xs font-bold border border-red-100">
          <i className="fas fa-trash-alt"></i> Clear Cart
        </button>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-slate-50">
        {count === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 select-none pointer-events-none">
            <i className="fas fa-cash-register text-gray-300 text-5xl mb-4"></i>
            <p className="text-sm font-medium">Scan items to sell</p>
          </div>
        )}
        
        {Object.entries(currentSession?.items || {}).map(([key, item]) => (
          <div key={key} className={`bg-white p-3 rounded-lg shadow-sm border flex justify-between group animate-fade-in relative overflow-hidden ${item.qty < 0 ? 'border-l-4 border-l-red-500 border-gray-100' : 'border-gray-100'}`}>
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-sm font-bold text-gray-800 leading-tight truncate">{item.n}</div>
              <div className="text-[11px] text-gray-500 mt-1.5 flex items-center flex-wrap gap-1">
                {item.v_name && <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100 font-semibold">{item.v_name}</span>}
                <span className="text-gray-400">{Math.abs(item.qty)} x ₦{CURRENCY.format(item.p)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              {/* NEW: Dynamic Price Display */}
              {item.p <= 0 || item.is_var ? (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-gray-400 text-xs">₦</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    inputMode="decimal"
                    value={editablePrices[key] || ''}
                    onChange={(e) => setEditablePrices(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-24 px-2 py-1 border border-dashed border-purple-300 rounded text-sm text-right font-bold focus:border-solid focus:border-purple-500 outline-none bg-purple-50"
                  />
                </div>
              ) : (
                <span className="font-bold text-gray-900">₦{CURRENCY.format(item.p * item.qty)}</span>
              )}
              <div className="flex items-center bg-gray-100 rounded-lg mt-2 border border-gray-200">
                <button onClick={() => modItem(key, -1)} className="w-8 h-7 hover:bg-white rounded text-gray-600 flex items-center justify-center"><i className="fas fa-minus text-[10px]"></i></button>
                <span className="w-8 text-center text-xs font-bold">{Math.abs(item.qty)}</span>
                <button onClick={() => modItem(key, 1)} className="w-8 h-7 hover:bg-white rounded text-green-600 flex items-center justify-center"><i className="fas fa-plus text-[10px]"></i></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Totals & Payment */}
      <div className="p-4 bg-white border-t z-20 flex-none shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-6 md:pb-4">
        <div className="space-y-1 mb-3 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>₦{CURRENCY.format(rawSubtotal)}</span>
          </div>
          <div onClick={() => window.dispatchEvent(new CustomEvent('open-discount'))} className="flex justify-between text-emerald-600 cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1">
            <span className="flex items-center gap-1"><i className="fas fa-tag"></i> Discount</span>
            <span>-₦{CURRENCY.format(discountAmt)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-end mb-4 pt-2 border-t border-dashed">
          <div className="text-xs text-gray-500 font-bold uppercase">{totalVal < 0 ? 'Total Refund' : 'Total Payable'}</div>
          <div className={`text-3xl font-black tracking-tight ${totalVal < 0 ? 'text-red-600' : 'text-gray-900'}`}>₦{CURRENCY.format(totalVal)}</div>
        </div>
        
        {/* Horizontal Scrolling Checkout Buttons */}
        <div className="flex gap-3 h-14 overflow-x-auto custom-scrollbar pb-1 snap-x snap-mandatory">
          <button onClick={() => processPayment('cash')} disabled={count === 0} className="flex-none w-24 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase shadow active:scale-95 transition-all disabled:opacity-50 flex flex-col items-center justify-center leading-none gap-1 snap-center">
            <span className="text-sm">Cash</span>
            <span className="text-[9px] opacity-70">(F8)</span>
          </button>
          <button onClick={() => processPayment('pos')} disabled={count === 0} className="flex-none w-24 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase shadow active:scale-95 transition-all disabled:opacity-50 flex flex-col items-center justify-center leading-none gap-1 snap-center">
            <span className="text-sm">POS</span>
            <span className="text-[9px] opacity-70">(F9)</span>
          </button>
          <button onClick={() => processPayment('bank')} disabled={count === 0} className="flex-none w-24 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase shadow active:scale-95 transition-all disabled:opacity-50 flex flex-col items-center justify-center leading-none gap-1 snap-center">
            <span className="text-sm">Trans</span>
            <span className="text-[9px] opacity-70">(F10)</span>
          </button>
          <button onClick={handleCreditClick} disabled={count === 0} className="flex-none w-24 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs uppercase shadow active:scale-95 transition-all disabled:opacity-50 flex flex-col items-center justify-center leading-none gap-1 snap-center">
            <span className="text-sm">Credit</span>
            <span className="text-[9px] opacity-70"><i className="fas fa-user"></i></span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <RefundModal show={showRefundModal} onClose={() => setShowRefundModal(false)} />
      <CreditModal show={showCreditModal} onClose={() => setShowCreditModal(false)} />
    </>
  );
}