"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle } from '@untitledui/icons';

interface ProductActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actionType: 'DELIST' | 'RELIST', reason: string) => Promise<void>;
  productTitle: string;
  isCurrentlyDelisted: boolean;
}

export default function ProductActionModal({ isOpen, onClose, onConfirm, productTitle, isCurrentlyDelisted }: ProductActionModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const dynamicAction = isCurrentlyDelisted ? 'RELIST' : 'DELIST';
    await onConfirm(dynamicAction, reason);
    setSubmitting(false);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 relative z-10 overflow-hidden"
      >
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Catalog Moderation Desk</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400"><X className="size-5" /></button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`p-4 rounded-2xl border flex gap-3 ${isCurrentlyDelisted ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              You are updating public discovery parameters for <strong className="text-slate-900">"{productTitle}"</strong>. Doing so will toggle its display state inside public search feeds.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
              Moderation Reason Note <span className="text-slate-400 font-medium">(Optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isCurrentlyDelisted ? "Provide a reason for reinstating this item..." : "Detail why this product is being delisted..."}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 resize-none"
            />
          </div>

          <footer className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl">Cancel</button>
            <button 
              type="submit" 
              disabled={submitting} 
              className={`flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all ${
                isCurrentlyDelisted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {submitting ? 'Syncing...' : isCurrentlyDelisted ? 'Relist Item' : 'Delist Item'}
            </button>
          </footer>
        </form>
      </motion.div>
    </div>
  );
}