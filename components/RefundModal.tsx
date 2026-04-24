'use client';
import { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';

export default function RefundModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [invoiceId, setInvoiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refundByInvoice = usePosStore((s) => s.refundByInvoice);

  if (!show) return null;

  const handleRefund = async () => {
    setError('');
    setLoading(true);
    
    const err = await refundByInvoice(invoiceId);
    
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      onClose(); // Close modal on success
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-gray-800 mb-1 flex items-center gap-2">
          <i className="fas fa-undo text-red-500"></i> Process Return
        </h3>
        <p className="text-sm text-gray-500 mb-4">Enter the Invoice ID from the customer's receipt.</p>
        
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-500 uppercase">Invoice ID</label>
          <input 
            type="text" 
            value={invoiceId}
            onChange={e => setInvoiceId(e.target.value)}
            placeholder="e.g. ORD-1690000000"
            className="w-full mt-1 border border-gray-200 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleRefund()}
          />
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button 
            onClick={handleRefund} 
            disabled={loading || !invoiceId}
            className="py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Searching...</> : 'Fetch Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}