import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, CartSession, Order, DatabaseProduct } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

interface POSState {
  // UI State
  mobileView: 'products' | 'cart';
  search: string;
  limit: number;
  variantModalProduct: Product | null;
  crudModalOpen: boolean;
  editingProduct: Product | null;
  isLoadingProducts: boolean;

  // Data State
  products: Product[];

  // Cart State
  sessions: Record<string, CartSession>;
  activeTab: string;

  // Receipt & Queue State
  currentReceipt: Order | null;
  queue: Order[];
  syncing: boolean;

  // UI Actions
  setMobileView: (view: 'products' | 'cart') => void;
  setSearch: (s: string) => void;
  openVariantModal: (product: Product) => void;
  closeVariantModal: () => void;
  openCrudModal: (product?: Product) => void;
  closeCrudModal: () => void;

  // Data Actions
  fetchProducts: (branchId: string) => Promise<void>;

  // Cart Tab Actions
  switchTab: (id: string) => void;
  createTab: () => void;
  closeTab: (id: string) => void;

  // Cart Item Actions
  addToCart: (p: Product, v?: Product['v'][0]) => void;
  modItem: (key: string, n: number) => void;
  clearCart: () => void;
  applyDiscount: (val: number, type: 'fixed' | 'percent') => void;

  // Receipt & Queue Actions
  closeReceipt: () => void;
  processPayment: (method: string) => void;
  processQueue: () => Promise<void>;
  refundByInvoice: (invoiceId: string) => Promise<string | null>;
}

export const usePosStore = create<POSState>()(
  persist(
    (set, get) => ({
      // ==========================================
      // DEFAULT STATE
      // ==========================================
      mobileView: 'products',
      search: '',
      limit: 24,
      variantModalProduct: null,
      crudModalOpen: false,
      editingProduct: null,
      isLoadingProducts: true,

      products: [],

      sessions: { t1: { number: 1, items: {}, discount: 0, discountType: 'fixed' } },
      activeTab: 't1',

      currentReceipt: null,
      queue: [],
      syncing: false,

      // ==========================================
      // UI ACTIONS
      // ==========================================
      setMobileView: (view) => set({ mobileView: view }),
      setSearch: (s) => set({ search: s, limit: 24 }),
      
      openVariantModal: (product) => set({ variantModalProduct: product }),
      closeVariantModal: () => set({ variantModalProduct: null }),
      
      openCrudModal: (product) => set({ crudModalOpen: true, editingProduct: product || null }),
      closeCrudModal: () => set({ crudModalOpen: false, editingProduct: null }),

      // ==========================================
      // DATA ACTIONS (SUPABASE)
      // ==========================================
      fetchProducts: async (branchId: string) => {
        if (!branchId) return;
        set({ isLoadingProducts: true });
        
        const { data, error } = await supabase
          .from('products')
          .select('id, name, barcode, price, stock, variants(*)')
          .eq('branch_id', branchId);

        if (!error && data) {
          const mappedData: Product[] = data.map((p: DatabaseProduct) => ({
            id: p.id, n: p.name, b: p.barcode || '', p: parseFloat(p.price), s: p.stock,
            v: (p.variants || []).map(variant => ({ id: variant.id, n: variant.variant_name, q: variant.unit_qty, p: parseFloat(variant.price),  is_var: variant.is_variable_price || false  }))
          }));
          set({ products: mappedData, isLoadingProducts: false });
        } else {
          console.error("Supabase fetch error:", error);
          set({ isLoadingProducts: false });
        }
      },

      // ==========================================
      // CART TAB ACTIONS
      // ==========================================
      switchTab: (id) => set({ activeTab: id }),
      
      createTab: () => {
        const state = get();
        const id = 't' + Date.now();
        set({
          sessions: { ...state.sessions, [id]: { number: Object.keys(state.sessions).length + 1, items: {}, discount: 0, discountType: 'fixed' } },
          activeTab: id
        });
      },
      
      closeTab: (id) => {
        const state = get();
        const newSessions = { ...state.sessions };
        delete newSessions[id];
        if (Object.keys(newSessions).length === 0) {
          newSessions['t1'] = { number: 1, items: {}, discount: 0, discountType: 'fixed' };
        }
        set({ sessions: newSessions, activeTab: Object.keys(newSessions)[0] });
      },

      // ==========================================
      // CART ITEM ACTIONS
      // ==========================================
            addToCart: (p, v = undefined, overridePrice = undefined) => {
        const state = get();
        const vid = v ? v.id : 'base';
        const key = `${p.id}_${vid}`;
        const items = { ...state.sessions[state.activeTab].items };
        const qtyToAdd = 1;

        // NEW: Determine final price (Override > Variant > Base)
        const finalPrice = overridePrice || (v ? v.p : p.p);

        if (items[key]) {
          items[key].qty += qtyToAdd;
        } else {
          items[key] = { 
            id: p.id, n: p.n, b: p.b, p: finalPrice, // <-- USE finalPrice
            v_name: v ? v.n : null, vid: v ? String(v.id) : null, qty: qtyToAdd 
          };
        }

        if (items[key].qty === 0) delete items[key];
        set({ sessions: { ...state.sessions, [state.activeTab]: { ...state.sessions[state.activeTab], items } }, search: '' });
      },

      modItem: (key, n) => {
        const state = get();
        const items = { ...state.sessions[state.activeTab].items };
        if (items[key]) {
          items[key].qty += n;
          if (items[key].qty === 0) delete items[key];
        }
        set({ sessions: { ...state.sessions, [state.activeTab]: { ...state.sessions[state.activeTab], items } } });
      },

      clearCart: () => {
        const state = get();
        if (!confirm('Clear cart?')) return;
        set({ 
          sessions: { ...state.sessions, [state.activeTab]: { ...state.sessions[state.activeTab], items: {}, discount: 0 } } 
        });
      },

      applyDiscount: (val, type) => {
        const state = get();
        set({ 
          sessions: { ...state.sessions, [state.activeTab]: { ...state.sessions[state.activeTab], discount: val, discountType: type } } 
        });
      },

      // ==========================================
      // RECEIPT & QUEUE ACTIONS
      // ==========================================
      closeReceipt: () => set({ currentReceipt: null }),

            processPayment: (method: string, customerName?: string, customerPhone?: string) => {
        const state = get();
        const session = state.sessions[state.activeTab];
        const items = Object.values(session.items);
        if (items.length === 0) return;

        const rawSubtotal = items.reduce((a, i) => a + (i.p * i.qty), 0);
        let discountAmt = 0;
        if (session.discountType === 'percent') {
          discountAmt = rawSubtotal * ((session.discount || 0) / 100);
        } else {
          discountAmt = session.discount || 0;
        }
        const total = Math.round((rawSubtotal - discountAmt + Number.EPSILON) * 100) / 100;
        const now = new Date();

                const newOrder: Order = {
          id: 'ORD-' + Math.floor(Date.now() / 1000),
          date: now.toLocaleString('en-NG'),
          method: method.toUpperCase(),
          items: items,
          total: total,
          raw_total: total,
          user_name: useAuthStore.getState().profile?.full_name || 'Unknown Cashier',
          customer_name: customerName || null, // <-- ADD THIS
          customer_phone: customerPhone || null // <-- ADD THIS
        };

        const newProducts = state.products.map(p => {
          const cartItem = items.find(i => i.id === p.id);
          return cartItem ? { ...p, s: p.s - cartItem.qty } : p;
        });

        set({
          products: newProducts,
          queue: [...state.queue, newOrder],
          currentReceipt: newOrder,
          sessions: { 
            ...state.sessions, 
            [state.activeTab]: { ...session, items: {}, discount: 0 } 
          },
          mobileView: 'cart'
        });
      },

      processQueue: async () => {
        const state = get();
        if (state.queue.length === 0 || state.syncing) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        const branchId = useAuthStore.getState().activeBranchId;
        const companyId = useAuthStore.getState().profile?.company_id;

        set({ syncing: true });
        const orderToSync = state.queue[0];

        if (!user || !companyId || !branchId) {
          console.error("[Supabase] Sync failed: Missing auth context.");
          set({ syncing: false });
          return;
        }

        try {
                    const { data: orderRes, error: orderErr } = await supabase.from('orders').insert({
            id: orderToSync.id,
            company_id: companyId,
            branch_id: branchId,
            user_id: user.id,
            total: orderToSync.total,
            method: orderToSync.method,
            user_name: orderToSync.user_name,
            customer_name: orderToSync.customer_name, // <-- ADD THIS
            customer_phone: orderToSync.customer_phone  // <-- ADD THIS
          }).select('id').single();

          if (orderErr) throw new Error(orderErr.message || JSON.stringify(orderErr));

                    const itemsToInsert = orderToSync.items.map(item => ({
            order_id: orderRes.id, 
            product_id: item.id, 
            // SAFETY: Convert "base" or non-numeric strings to null for the BIGINT column
            variant_id: (item.vid && item.vid !== 'base' && !isNaN(Number(item.vid))) ? Number(item.vid) : null,
            product_name: item.n, 
            quantity: item.qty, 
            price: item.p
          }));

          const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
          if (itemsErr) throw new Error(itemsErr.message || JSON.stringify(itemsErr));

          usePosStore.setState({ queue: usePosStore.getState().queue.slice(1) });
          console.log(`[Supabase] Order ${orderToSync.id} synced successfully!`);

        } catch (error: any) {
          const errorMsg = error.message || JSON.stringify(error);
          if (errorMsg.includes('duplicate key') || errorMsg.includes('409')) {
            console.warn(`[Supabase] Order ${orderToSync.id} already synced. Removing from queue.`);
            usePosStore.setState({ queue: usePosStore.getState().queue.slice(1) });
          } else {
            console.error(`[Supabase] Sync failed for ${orderToSync.id}:`, errorMsg);
          }
        } finally {
          set({ syncing: false });
        }
      },

            refundByInvoice: async (invoiceId: string) => {
        if (!invoiceId.trim()) return "Please enter an Invoice ID";
        
        // SMART FIX: Auto-add "ORD-" if the user just typed the numbers
        let finalId = invoiceId.trim();
        if (!finalId.startsWith('ORD-')) {
          finalId = 'ORD-' + finalId;
        }

        const { data: order, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', finalId)
          .single();

        if (error || !order) return "Invoice not found in this branch.";
        if (!order.order_items || order.order_items.length === 0) return "Invoice has no items.";

        const state = get();
        const items = { ...state.sessions[state.activeTab].items };

        order.order_items.forEach((item: any) => {
          const vid = item.variant_id || 'base';
          const key = `${item.product_id}_${vid}`;
          
          if (items[key]) {
            items[key].qty -= item.quantity;
          } else {
            items[key] = { 
              id: item.product_id, n: item.product_name, b: '', p: item.price, 
              v_name: null, vid: item.variant_id ? String(item.variant_id) : null, 
              qty: -item.quantity 
            };
          }
          
          if (items[key].qty === 0) delete items[key];
        });

        set({ 
          sessions: { ...state.sessions, [state.activeTab]: { ...state.sessions[state.activeTab], items } },
          mobileView: 'cart'
        });
        
        return null;
      }
    }),
    {
      name: 'pos-cart-storage', 
      partialize: (state) => ({ 
        sessions: state.sessions, 
        activeTab: state.activeTab,
        queue: state.queue
      }),
    }
  )
);