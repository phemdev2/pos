'use client';
import { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { CURRENCY } from '@/lib/types';

interface VariantOption {
  id: string;
  n: string;
  q: number;
  p: number;
  is_var: boolean;
}

export default function VariantModal() {
  const product = usePosStore((s) => s.variantModalProduct);
  const closeVariantModal = usePosStore((s) => s.closeVariantModal);
  const setMobileView = usePosStore((s) => s.setMobileView);

  const [variantPrices, setVariantPrices] = useState<Record<string, string>>({});

  if (!product) return null;

  const allOptions: VariantOption[] = [
    { id: 'base', n: 'Default Unit', q: 1, p: product?.p || 0, is_var: false },
    ...(product?.v || []).map((v: any) => ({
      id: String(v.id || ''),
      n: v.n || 'Option',
      q: v.q || 1,
      p: v.p || 0,
      is_var: v.is_var || false,
    })),
  ];

  const getPrice = (v: VariantOption): number => {
    const edited = variantPrices[v.id];
    if (edited !== undefined && edited !== '') return parseFloat(edited) || 0;
    return v.p || 0;
  };

  const handleSelectVariant = (v: VariantOption) => {
    const finalPrice = getPrice(v);
    usePosStore.getState().addToCart(product, v.id === 'base' ? undefined : v, finalPrice);
    closeVariantModal();
    if (window.innerWidth < 768) setMobileView('cart');
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4"
      onClick={closeVariantModal}
    >
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[80vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <div className="min-w-0">
            <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wide">
              Select Option
            </span>
            <span className="font-bold text-gray-800 truncate block text-lg">
              {product?.n || ''}
            </span>
          </div>
          <button
            onClick={closeVariantModal}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Options */}
        <div className="p-2 space-y-2 overflow-y-auto flex-1 bg-gray-50/50">
          {allOptions.map((v) => (
            <div
              key={v.id}
              className="w-full flex justify-between items-center p-3 bg-white border border-gray-100 shadow-sm hover:border-purple-300 rounded-xl group transition-all"
            >
              {/* Left: Name + Qty */}
              <div className="text-left flex-1 mr-3 min-w-0">
                <div className="font-bold text-gray-800 group-hover:text-purple-700 truncate">
                  {v.n}
                </div>
                <div className="text-xs text-gray-400">Qty: {v.q}</div>
              </div>

              {/* Right: Editable Price + Add Button */}
              <div className="flex items-center gap-2 flex-none">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                    ₦
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={variantPrices[v.id] !== undefined ? variantPrices[v.id] : String(v.p || '')}
                    onChange={(e) =>
                      setVariantPrices((prev) => ({ ...prev, [v.id]: e.target.value }))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-28 pl-6 pr-2 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-right focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <button
                  onClick={() => handleSelectVariant(v)}
                  className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}