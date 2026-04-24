'use client';
import { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';

interface Props {
  show: boolean;
  onClose: () => void;
}

export default function CreditModal({ show, onClose }: Props) {
  const processPayment = usePosStore((s) => s.processPayment);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Customer name and phone are required for credit sales.");
      return;
    }
    processPayment('credit', name.trim(), phone.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-gray-800 mb-1 flex items-center gap-2">
          <i className="fas fa-file-invoice-dollar text-orange-500"></i> Credit Sale
        </h3>
        <p className="text-sm text-gray-500 mb-4">Enter the customer's details to process this on credit.</p>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Customer Name *</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" 
              placeholder="e.g. John Doe"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Phone Number *</label>
            <input 
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" 
              placeholder="e.g. 08012345678"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose} className="py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="py-2.5 rounded-lg bg-orange-600 text-white font-bold text-sm hover:bg-orange-700">
              Process Credit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}