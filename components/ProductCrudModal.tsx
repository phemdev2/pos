'use client';
import { useState, useEffect } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export default function ProductCrudModal() {
  const crudModalOpen = usePosStore((s) => s.crudModalOpen);
  const editingProduct = usePosStore((s) => s.editingProduct);
  const closeCrudModal = usePosStore((s) => s.closeCrudModal);
  const fetchProducts = usePosStore((s) => s.fetchProducts);

  const isEditing = !!editingProduct;

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isVariable, setIsVariable] = useState(false); // <-- MISSING STATE ADDED HERE
  
  // Variants State
  const [variants, setVariants] = useState([{ id: Date.now(), n: '', q: 1, p: '' }]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pre-fill form if editing
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.n);
      setBarcode(editingProduct.b);
      setPrice(String(editingProduct.p));
      setStock(String(editingProduct.s));
      setIsVariable(editingProduct.is_var || false); // <-- MISSING PREFILL ADDED HERE
      
      if (editingProduct.v.length > 0) {
        setVariants(editingProduct.v.map(v => ({ id: v.id, n: v.n, q: v.q, p: String(v.p) })));
      } else {
        setVariants([{ id: Date.now(), n: '', q: 1, p: '' }]);
      }
    } else {
      setName(''); setBarcode(''); setPrice(''); setStock('');
      setIsVariable(false); // <-- RESET ON NEW PRODUCT
      setVariants([{ id: Date.now(), n: '', q: 1, p: '' }]);
    }
  }, [editingProduct, crudModalOpen]);

  const handleVariantChange = (id: number, field: string, value: string | number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const addVariantRow = () => {
    setVariants([...variants, { id: Date.now(), n: '', q: 1, p: '' }]);
  };

  const removeVariantRow = (id: number) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct || !confirm(`Delete ${editingProduct.n} permanently?`)) return;
    setDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', editingProduct.id);
    if (!error) {
      await fetchProducts();
      closeCrudModal();
    } else {
      alert("Failed to delete: " + error.message);
    }
    setDeleting(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return alert("Name and Base Price are required.");
    
    setSaving(true);
    const companyId = useAuthStore.getState().profile?.company_id;
    const branchId = useAuthStore.getState().activeBranchId;
    
    const productData = { 
      company_id: companyId, 
      branch_id: branchId,
      name, 
      barcode, 
      price: parseFloat(price), 
      stock: parseInt(stock) || 0,
      is_variable_price: isVariable // <-- INCLUDED HERE
    };

    try {
      let productId = editingProduct?.id;

      // 1. Insert or Update Product
      if (isEditing) {
        const { error } = await supabase.from('products').update(productData).eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(productData).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      // 2. Handle Variants (Delete old ones, insert new ones)
      if (isEditing) {
        await supabase.from('variants').delete().eq('product_id', productId);
      }

      // Insert new variants (filter out empty rows)
      const validVariants = variants.filter(v => v.n && v.p);
      if (validVariants.length > 0) {
        const variantsToInsert = validVariants.map(v => ({
          product_id: productId,
          variant_name: v.n,
          unit_qty: v.q,
          price: parseFloat(v.p)
        }));
        const { error: varError } = await supabase.from('variants').insert(variantsToInsert);
        if (varError) throw varError;
      }

      // 3. Refresh list and close
      await fetchProducts();
      closeCrudModal();
    } catch (error: any) {
      alert("Save failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!crudModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4" onClick={closeCrudModal}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
          <h3 className="font-bold text-gray-800">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button onClick={handleDeleteProduct} disabled={deleting} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded font-bold disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button onClick={closeCrudModal} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Product Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Barcode</label>
              <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Stock Qty</label>
              <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Base Price (₦) *</label>
            <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 font-bold text-lg focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          
          {/* Variable Price Toggle */}
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
            <div>
              <label className="text-xs font-bold text-yellow-800 uppercase">Variable Price</label>
              <p className="text-[10px] text-yellow-600">No fixed price. Ask customer at checkout.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsVariable(!isVariable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isVariable ? 'bg-yellow-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${isVariable ? 'translate-x-5' : 'translate-x-1'} bg-white`}></span>
            </button>
          </div>

          {/* Variants Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Options / Variants</label>
              <button type="button" onClick={addVariantRow} className="text-xs text-purple-600 font-bold hover:underline">+ Add Option</button>
            </div>
            
            <div className="space-y-2">
              {variants.map((v, index) => (
                <div key={v.id} className="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <input 
                    type="text" 
                    placeholder="Name (e.g. Large)" 
                    value={v.n} 
                    onChange={e => handleVariantChange(v.id, 'n', e.target.value)}
                    className="flex-1 border border-gray-200 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                  />
                  <input 
                    type="number" 
                    placeholder="₦ Price" 
                    value={v.p} 
                    onChange={e => handleVariantChange(v.id, 'p', e.target.value)}
                    className="w-24 border border-gray-200 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                  />
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariantRow(v.id)} className="text-red-400 hover:text-red-600 mt-1">
                      <i className="fas fa-times-circle"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Leave blank to save as a standard product without options.</p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex gap-3">
          <button type="button" onClick={closeCrudModal} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-100">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={saving} 
            className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}