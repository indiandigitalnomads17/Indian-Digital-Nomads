"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, FileCheck02, FileX02, LinkExternal01 } from '@untitledui/icons';

interface KycReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'APPROVED' | 'REJECTED', notes: string) => Promise<void>;
  user: { id: string; fullName: string; email: string; kycDocumentLink: string | null } | null;
}

export default function KycReviewModal({ isOpen, onClose, onConfirm, user }: KycReviewModalProps) {
  const [verdict, setVerdict] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onConfirm(verdict, verdict === 'REJECTED' ? rejectionNotes : '');
    setSubmitting(false);
    setRejectionNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl p-6 relative z-10 max-h-[90vh] overflow-y-auto"
      >
        <header className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Audit Identity Credentials</h3>
            <p className="text-xs text-slate-400 font-medium">Verify official government records for account authentication approval.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400"><X className="size-5" /></button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs font-semibold">
            <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Nomad Full Name</p><p className="text-slate-800 font-bold text-sm mt-0.5">{user.fullName}</p></div>
            <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Email Parameter</p><p className="text-slate-800 font-bold text-sm mt-0.5 truncate">{user.email}</p></div>
          </div>

          {/* Document Link Inspection Zone */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Submitted Government ID Asset</label>
            {user.kycDocumentLink ? (
              <a 
                href={user.kycDocumentLink} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50/30 text-blue-700 text-xs font-bold hover:bg-blue-50 transition-all shadow-xs"
              >
                <span className="flex items-center gap-2">📄 Open Verification Document In New Tab</span>
                <LinkExternal01 className="size-4" />
              </a>
            ) : (
              <div className="p-4 rounded-xl border border-red-100 bg-red-50/30 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="size-4" /> Cloud Storage Reference Link Is Missing
              </div>
            )}
          </div>

          {/* Verification Verdict Selector Tabs */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Verification Decision Verdict</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVerdict('APPROVED')}
                className={`p-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  verdict === 'APPROVED' ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800 shadow-sm shadow-emerald-500/5' : 'border-slate-100 bg-white text-slate-400'
                }`}
              >
                <FileCheck02 className="size-4 text-emerald-600" /> Pass & Approve Profile
              </button>
              <button
                type="button"
                onClick={() => setVerdict('REJECTED')}
                className={`p-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  verdict === 'REJECTED' ? 'border-red-500 bg-red-50/40 text-red-800 shadow-sm shadow-red-500/5' : 'border-slate-100 bg-white text-slate-400'
                }`}
              >
                <FileX02 className="size-4 text-red-600" /> Deny & Reject Request
              </button>
            </div>
          </div>

          {/* Conditional Rejection Notes Area */}
          {verdict === 'REJECTED' && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Rejection Reason Explanations Notes</label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                required
                placeholder="Detail why these credentials failed verification. This note is dispatched back to the target user interface profile panel automatically..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 resize-none"
              />
            </motion.div>
          )}

          <footer className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors">Discard Audit</button>
            <button 
              type="submit" 
              disabled={submitting} 
              className={`flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all ${
                verdict === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
              } disabled:opacity-50`}
            >
              {submitting ? 'Syncing...' : 'Commit Operational Verdict'}
            </button>
          </footer>
        </form>
      </motion.div>
    </div>
  );
}