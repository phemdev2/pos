'use client';
import { usePosStore } from '@/store/usePosStore';
import { CURRENCY } from '@/lib/types';

export default function ReceiptModal() {
  const receipt = usePosStore((s) => s.currentReceipt);
  const closeReceipt = usePosStore((s) => s.closeReceipt);
  const setMobileView = usePosStore((s) => s.setMobileView);

  if (!receipt) return null;

  const handlePrint = () => {
    const printContents = document.getElementById('receipt-print-area')?.innerHTML;
    if (!printContents) return;
    
    const win = window.open('', '', 'height=600,width=400');
    if (!win) return;
    
    win.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; font-size: 12px; color: #000; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 10px; }
            .mt-4 { margin-top: 16px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleNewSale = () => {
    closeReceipt();
    setMobileView('products');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col h-[85vh] animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-emerald-50">
          <h3 className="font-bold text-emerald-700 flex items-center gap-2">
            <i className="fas fa-check-circle"></i> Payment Complete
          </h3>
          <button onClick={closeReceipt} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-100">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Receipt Paper */}
        <div className="flex-1 bg-gray-200 overflow-y-auto p-4 flex justify-center">
          <div id="receipt-print-area" className="bg-white w-full shadow-md p-4 text-[12px] text-gray-800 font-mono leading-relaxed">
            
            <div className="text-center mb-2">
              <div className="font-bold text-base uppercase tracking-wide">My Store</div>
              <div className="text-[10px] text-gray-500 mt-1">123 Main Street, Lagos</div>
              <div className="text-[10px] text-gray-500">Tel: 08012345678</div>
            </div>

            <div className="line"></div>

                      <div className="row text-[10px] text-gray-500 mb-1">
              <span>{receipt.date} </span>
              <span>Order: {receipt.id}</span>
            </div>
            <div className="text-[10px] text-gray-500 mb-2">Method: {receipt.method}</div>

            <div className="line"></div>

            <div className="space-y-2 my-2">
              {receipt.items.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between font-bold">
                    <span className="flex-1 pr-2">{item.n}</span>
                    <span>₦{CURRENCY.format(item.p * item.qty)}</span>
                  </div>
                  {item.v_name && <div className="text-[10px] text-gray-500 pl-2">({item.v_name})</div>}
                  <div className="text-[10px] text-gray-500">{Math.abs(item.qty)} x ₦{CURRENCY.format(item.p)}</div>
                </div>
              ))}
            </div>

            <div className="line"></div>

            <div className="row font-bold text-lg mt-2">
              <span>TOTAL</span>
              <span>₦{CURRENCY.format(receipt.total)}</span>
            </div>

            <div className="text-center mt-6 text-[10px] text-gray-500">
              <p>Cashier: {receipt.user_name}</p>
                           {receipt.method === 'CREDIT' && receipt.customer_name && (
                <div style={{ marginTop: '10px', padding: '8px', border: '1px dashed #000', background: '#fff8f0' }}>
                  <p style={{ fontWeight: 'bold', color: '#000', marginBottom: '4px' }}>CREDIT SALE DETAILS</p>
                  <p>Customer: {receipt.customer_name}</p>
                  <p>Phone: {receipt.customer_phone}</p>
                </div>
              )}
              <p className="font-bold text-gray-700 mt-2">Thank you for your patronage!</p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-white grid grid-cols-2 gap-3 pb-6 md:pb-4">
          <button onClick={handlePrint} className="py-3 bg-slate-800 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <i className="fas fa-print"></i> Print
          </button>
          <button onClick={handleNewSale} className="py-3 bg-gray-100 text-gray-800 rounded-lg font-bold border border-gray-200 active:scale-95 transition-transform">
            New Sale
          </button>
        </div>

      </div>
    </div>
  );
}