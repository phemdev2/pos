'use client';
import { useState, useEffect } from 'react';
import { CURRENCY } from '@/lib/types';

interface Props {
  show: boolean;
  onClose: () => void;
  productName: string;
  defaultPrice?: number;
  onConfirm: (price: number) => void;
}

export default function PricePromptModal({ show, onClose, productName, defaultPrice = 0, onConfirm }: Props) {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  // Pre-fill with default price whenever modal opens
  useEffect(() => {
    if (show) {
      setPrice(defaultPrice > 0 ? String(defaultPrice) : '');
      setError('');
    }
  }, [show, defaultPrice]);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (!numPrice || numPrice <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    onConfirm(numPrice);
    setPrice('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg text-gray-800 mb-1">Enter Selling Price</h3>
        <p className="text-sm text-gray-500 mb-1 truncate">{productName}</p>
        {defaultPrice > 0 && (
          <p className="text-xs text-purple-500 font-medium mb-4">
            Listed price: ₦{CURRENCY.format(defaultPrice)}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setError(''); }}
              className="w-full pl-8 border border-gray-200 rounded-lg p-3 text-lg font-bold focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="0.00"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 rounded-lg bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition"
            >
              Add to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}