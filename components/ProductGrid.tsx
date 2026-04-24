'use client';
import { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CURRENCY } from '@/lib/types';
import PricePromptModal from './PricePromptModal';

export default function ProductGrid() {
  const products = usePosStore((s) => s.products);
  const search = usePosStore((s) => s.search);
  const limit = usePosStore((s) => s.limit);
  const setSearch = usePosStore((s) => s.setSearch);
  const setMobileView = usePosStore((s) => s.setMobileView);
  const openVariantModal = usePosStore((s) => s.openVariantModal);

  const [priceModal, setPriceModal] = useState<{ show: boolean; product: any }>({
    show: false,
    product: null,
  });

  const s = search.toLowerCase().trim();
  const filtered = s
    ? products.filter((p) => p.n.toLowerCase().includes(s) || (p.b && p.b.includes(s)))
    : products;
  const visibleProducts = filtered.slice(0, limit);

  const handleProductClick = (p: any) => {
    if (p.v && p.v.length > 0) {
      // Has variants — open variant modal
      openVariantModal(p);
    } else {
      // Always show price prompt so cashier can adjust price
      setPriceModal({ show: true, product: p });
    }
  };

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white p-3 border-b shadow-sm flex items-center gap-3 sticky top-0 z-30">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-3 bg-gray-100 border-2 border-transparent focus:bg-white focus:border-purple-500 rounded-xl text-sm outline-none"
            placeholder="Search products..."
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-2"
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {visibleProducts.map((p) => (
            <div key={p.id} className="relative group">

              {/* Main Card Button */}
              <button
                onClick={() => handleProductClick(p)}
                className="w-full flex flex-col justify-between bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 active:scale-95 md:hover:shadow-lg md:hover:border-purple-200 text-left h-[135px] md:h-[145px] touch-manipulation hover:-translate-y-0.5"
              >
                {/* Top: Price + Variant Badge */}
                <div className="flex justify-between items-start w-full mb-1">
                  <span className="font-bold text-sm md:text-base text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md tracking-tight w-fit flex items-center gap-1">
                    {p.is_var ? (
                      <>
                        <i className="fas fa-pencil-alt text-[9px] text-orange-500"></i>
                        <span className="text-orange-600">₦{CURRENCY.format(p.p)}</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-pencil-alt text-[9px] opacity-40"></i>
                        ₦{CURRENCY.format(p.p)}
                      </>
                    )}
                  </span>
                  {p.v.length > 0 && (
                    <i className="fas fa-layer-group text-xs text-emerald-500 bg-emerald-50 p-1 rounded"></i>
                  )}
                </div>

                {/* Middle: Name + Barcode */}
                <div className="flex-1 flex flex-col justify-center my-1">
                  <h3 className="font-semibold text-[13px] text-gray-700 leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">
                    {p.n}
                  </h3>
                  {p.b && (
                    <div className="text-[10px] text-gray-400 font-mono mt-1 truncate">
                      <i className="fas fa-barcode"></i> {p.b}
                    </div>
                  )}
                </div>

                {/* Bottom: Stock Bar */}
                <div className="w-full flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.s <= 5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (p.s / 20) * 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-[10px] font-bold ${p.s <= 0 ? 'text-red-500' : p.s < 5 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {p.s <= 0 ? 'Out' : p.s}
                  </span>
                </div>
              </button>

              {/* Floating Edit Button (Admin only) */}
              {useAuthStore.getState().profile?.role === 'admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    usePosStore.getState().openCrudModal(p);
                  }}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-md text-gray-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-gray-200 z-10"
                  title="Edit Product"
                >
                  <i className="fas fa-pen text-[10px] pointer-events-none"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Prompt Modal — always shown, pre-filled with existing price */}
      <PricePromptModal
        show={priceModal.show}
        onClose={() => setPriceModal({ show: false, product: null })}
        productName={priceModal.product?.n || ''}
        defaultPrice={priceModal.product?.p || 0}
        onConfirm={(price) => {
          usePosStore.getState().addToCart(priceModal.product, undefined, price);
          setPriceModal({ show: false, product: null });
          if (window.innerWidth < 768) setMobileView('cart');
        }}
      />
    </>
  );
}