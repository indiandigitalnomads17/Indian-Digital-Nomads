"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle } from '@untitledui/icons';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actionType: 'SUSPEND' | 'DEACTIVATE' | 'UNSUSPEND' | 'REACTIVATE', reason: string) => Promise<void>;
  freelancerName: string;
  currentStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

export default function FreelancerActionModal({ isOpen, onClose, onConfirm, freelancerName, currentStatus }: ActionModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // ---> LINE FIXED: We handle toggle tracking state using this hook variable <---
  const [selectedAction, setSelectedAction] = useState<'SUSPEND' | 'DEACTIVATE'>('SUSPEND');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Evaluate execution action branches depending on the target account state
    let finalAction: 'SUSPEND' | 'DEACTIVATE' | 'UNSUSPEND' | 'REACTIVATE' = selectedAction;
    if (currentStatus === 'SUSPENDED') finalAction = 'UNSUSPEND';
    if (currentStatus === 'DEACTIVATED') finalAction = 'REACTIVATE';

    await onConfirm(finalAction, reason);
    setSubmitting(false);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
      />

      {/* Modal Surface Box */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 relative z-10 overflow-hidden"
      >
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Moderate Profile Access</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors">
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
            <AlertCircle className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Modifying workspace clearance privileges for <strong className="text-slate-900">{freelancerName}</strong>. Current core account tracking status is flagged as: <span className="underline font-bold text-slate-900">{currentStatus}</span>.
            </p>
          </div>

          {/* Render Action Buttons for Active Profiles */}
          {currentStatus === 'ACTIVE' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Select Moderation Pipeline Action</label>
              <div className="grid grid-cols-2 gap-3">
                {/* ─── TOGGLE BUTTON 1: SUSPEND ─── */}
                <button
                  type="button"
                  onClick={() => setSelectedAction('SUSPEND')}
                  className={`p-3 rounded-xl border-2 font-bold text-xs text-center transition-all ${
                    selectedAction === 'SUSPEND'
                      ? 'border-amber-500 bg-amber-50/40 text-amber-800'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  ⚠️ Temporarily Suspend
                </button>
                
                {/* ─── TOGGLE BUTTON 2: DEACTIVATE ─── */}
                <button
                  type="button"
                  onClick={() => setSelectedAction('DEACTIVATE')}
                  className={`p-3 rounded-xl border-2 font-bold text-xs text-center transition-all ${
                    selectedAction === 'DEACTIVATE'
                      ? 'border-red-500 bg-red-50/40 text-red-800'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  🛑 Permanently Deactivate
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
              Reasoning Notes / Statement Message <span className="text-slate-400 font-medium">(Optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear, brief summary detailing why this action was performed. If omitted, a standard automated platform template will be substituted."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <footer className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Cancel Update
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all ${
                currentStatus === 'ACTIVE' 
                  ? selectedAction === 'SUSPEND'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
              } disabled:opacity-50`}
            >
              {submitting ? 'Syncing...' : currentStatus === 'ACTIVE' ? 'Apply Restrictions' : 'Reinstate Clearance'}
            </button>
          </footer>
        </form>
      </motion.div>
    </div>
  );
}