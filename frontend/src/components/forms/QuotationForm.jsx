import React, { useState } from 'react';

const QuotationForm = () => {
  const [amount, setAmount] = useState(1200);
  const fee = amount * 0.1;
  const payout = amount - fee;

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(11,28,48,0.06)] overflow-hidden border border-outline-variant/15">
      <div className="p-8 border-b border-surface-container-high">
        <h2 className="text-2xl font-bold text-on-surface font-headline">Submit Your Proposal</h2>
        <p className="text-sm text-on-surface-variant mt-1">Craft a professional quotation to stand out.</p>
      </div>
      
      <form className="p-8 space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant block ml-1">Quotation Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
              <input 
                className="w-full pl-8 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-surface-tint transition-all text-on-surface font-semibold" 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant block ml-1">Delivery Time</label>
            <select className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-surface-tint transition-all text-on-surface font-semibold appearance-none">
              <option>3 days</option>
              <option value="1w">1 week</option>
              <option>2 weeks</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant block ml-1">Your Pitch</label>
          <textarea 
            className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-surface-tint transition-all text-on-surface leading-relaxed resize-none" 
            placeholder="Describe your approach..." 
            rows="6"
          />
        </div>

        {/* Payout Summary */}
        <div className="bg-surface-container rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Quotation Amount</span>
            <span className="font-bold text-on-surface">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Service Fee (10%)</span>
            <span className="text-error font-medium">-${fee.toFixed(2)}</span>
          </div>
          <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end">
            <div>
              <p className="text-xs font-label uppercase tracking-widest text-primary font-bold">Estimated Payout</p>
              <p className="text-[10px] text-on-surface-variant">Paid after completion</p>
            </div>
            <span className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline">
              ${payout.toFixed(2)}
            </span>
          </div>
        </div>

        <button className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group">
          Submit Quote
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">send</span>
        </button>
      </form>
    </div>
  );
};

export default QuotationForm;