"use client";
import React, { useState } from 'react';
import api from '@/lib/api';

const ApplyModal = ({ job, onClose, onUpdate }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/v1/freelancer/send-proposal', {
        jobId: job.id,
        coverLetter,
        bidAmount: Number(bidAmount),
        estimatedDays: 7, // Default
      });

      if (response.data.success) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-lg">New Application</span>
            <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">Applying for "{job.title}"</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Your Proposal (Bid Amount)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                <input 
                  type="number" 
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={job.price.replace('₹', '').replace('$', '')}
                  className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Why should we hire you?</label>
              <textarea 
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Describe your relevant experience for this specific job..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-semibold text-sm min-h-[150px]"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Send Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;
