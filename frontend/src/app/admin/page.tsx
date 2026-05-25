"use client";
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import useAuth from '@/hooks/useAuth';
import { motion } from 'framer-motion';

// Premium Visual Icon Imports
import { 
  Coins01, 
  ShieldTick, 
  Briefcase01, 
  ShoppingBag01, 
  Users01,
  BarChart01,
  TrendUp01,
  AlertTriangle,
  File06
} from '@untitledui/icons';

// ─── PAYLOAD SCHEMA INTERFACES ───────────────────────────────────────────────
interface MetricsData {
  businesses: {
    total: number;
    breakdown: { ACTIVE?: number; SUSPENDED?: number; DEACTIVATED?: number };
  };
  freelancers: {
    total: number;
    breakdown: { ACTIVE?: number; SUSPENDED?: number; DEACTIVATED?: number };
  };
  jobs: {
    total: number;
    byStatus: { OPEN?: number; IN_PROGRESS?: number; COMPLETED?: number; CANCELLED?: number };
  };
  proposals: { total: number };
  products: { totalListed: number };
  kycVerification: { NOT_SUBMITTED?: number; PENDING_REVIEW?: number; APPROVED?: number; REJECTED?: number };
  financials: {
    overallVolume: { grossMarketplaceVolume: number; platformRevenueEarned: number };
    lastMonthPerformance: { grossMarketplaceVolume: number; platformRevenueEarned: number };
    byPaymentMethod: Array<{ method: string; transactionCount: number; totalVolume: number }>;
  };
}

export default function AdminDashboardMetricsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/admin/metrics/dashboard')
      .then((res) => {
        if (res.data.success) {
          setMetrics(res.data.data);
        }
      })
      .catch((err) => console.error("Error drawing platform status nodes:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-black text-slate-400 tracking-widest uppercase text-xs animate-pulse">
        Syncing Global Network Performance Ledgers...
      </div>
    );
  }

  const financial = metrics.financials;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      
      {/* ─── WORKSPACE TOP HEADER BANNER ─── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter mb-1.5 font-headline text-slate-900">
            System Metrics Overview
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Macro processing volumes, account validation indexes, and financial revenue distributions.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-2.5 w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase">Live Cache Connected</span>
        </div>
      </header>

      {/* ─── SECTION 1: CORE FINANCIAL MACRO LEDGERS ─── */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Financial Ecosystem Status</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Box 1: Cumulative Lifetime Volume Performance */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col justify-between min-h-[180px]">
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Lifetime Gross Marketplace Volume (GMV)</p>
              <h2 className="text-4xl font-black tracking-tight text-white">
                ₹{financial.overallVolume.grossMarketplaceVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="pt-4 border-t border-slate-800 mt-4 flex items-center gap-2 text-xs font-semibold text-blue-400">
              <Coins01 className="size-4 shrink-0" />
              <span>Net Platform Commission Revenue Earned: </span>
              <strong className="text-white">₹{financial.overallVolume.platformRevenueEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          {/* Box 2: Previous Month Interval Performance Context */}
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-3xl p-8 shadow-xl flex flex-col justify-between min-h-[180px]">
            <div>
              <p className="text-blue-200 font-bold text-xs uppercase tracking-widest mb-1">Prior Month Performance Log</p>
              <h2 className="text-4xl font-black tracking-tight text-white">
                ₹{financial.lastMonthPerformance.grossMarketplaceVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="pt-4 border-t border-blue-600/40 mt-4 flex items-center gap-2 text-xs font-semibold text-blue-100">
              <TrendUp01 className="size-4 shrink-0" />
              <span>Prior Month Commission Fees Generated: </span>
              <strong className="text-white">₹{financial.lastMonthPerformance.platformRevenueEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 2: MACRO PARTICIPANTS ACCOUNT BALANCES ─── */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Ecosystem Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Clients User Modules Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl"><Users01 className="size-5" /></span>
                <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Corporate Hub</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Listed Clients</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">{metrics.businesses.total}</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-4 text-center">
              <div className="bg-slate-50 rounded-xl p-2.5"><p className="text-[10px] font-bold text-emerald-600 uppercase">Active</p><span className="text-sm font-black text-slate-800">{metrics.businesses.breakdown.ACTIVE || 0}</span></div>
              <div className="bg-slate-50 rounded-xl p-2.5"><p className="text-[10px] font-bold text-amber-600 uppercase">Suspended</p><span className="text-sm font-black text-slate-800">{metrics.businesses.breakdown.SUSPENDED || 0}</span></div>
              <div className="bg-slate-50 rounded-xl p-2.5"><p className="text-[10px] font-bold text-red-600 uppercase">Deactive</p><span className="text-sm font-black text-slate-800">{metrics.businesses.breakdown.DEACTIVATED || 0}</span></div>
            </div>
          </div>

          {/* Freelancers Directory Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl"><Users01 className="size-5" /></span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Talent Network</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Active Freelancers</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">{metrics.freelancers.total}</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-4 text-center">
              <div className="bg-slate-50 rounded-xl p-2.5"><p className="text-[10px] font-bold text-emerald-600 uppercase">Active</p><span className="text-sm font-black text-slate-800">{metrics.freelancers.breakdown.ACTIVE || 0}</span></div>
              <div className="bg-slate-50 rounded-xl p-2.5"><p className="text-[10px] font-bold text-amber-600 uppercase">Suspended</p><span className="text-sm font-black text-slate-800">{metrics.freelancers.breakdown.SUSPENDED || 0}</span></div>
              <div className="bg-slate-50 rounded-xl p-2.5"><p className="text-[10px] font-bold text-red-600 uppercase">Deactive</p><span className="text-sm font-black text-slate-800">{metrics.freelancers.breakdown.DEACTIVATED || 0}</span></div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 3: MARKETPLACE ACTIVITY GIGS & PRODUCTS ─── */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Operational Funnel Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Job State Pipeline Tracker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Briefcase01 className="size-4" /></span>
                  <h4 className="text-sm font-bold text-slate-900">Total Work Gigs Posted</h4>
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.jobs.total}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Open</p>
                  <span className="text-base font-black text-slate-800">{metrics.jobs.byStatus.OPEN || 0}</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <p className="text-[10px] text-blue-500 font-bold uppercase">In Progress</p>
                  <span className="text-base font-black text-slate-800">{metrics.jobs.byStatus.IN_PROGRESS || 0}</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">Completed</p>
                  <span className="text-base font-black text-slate-800">{metrics.jobs.byStatus.COMPLETED || 0}</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <p className="text-[10px] text-red-400 font-bold uppercase">Cancelled</p>
                  <span className="text-base font-black text-slate-800">{metrics.jobs.byStatus.CANCELLED || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auxiliary Marketplace Asset Products Aggregators */}
          <div className="grid grid-rows-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"><File06 className="size-5" /></span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bids & Proposals</p>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{metrics.proposals.total} Filed</h4>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"><ShoppingBag01 className="size-5" /></span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Digital Store Inventory</p>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{metrics.products.totalListed} Assets</h4>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 4: GATEWAY RESOLUTION LOGS & KYC VERIFICATIONS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment System Transaction Split Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <BarChart01 className="size-4 text-slate-400" /> Operational Gateway System Splits
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-500">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-bold">Gateway Strategy</th>
                  <th className="pb-3 text-center font-bold">Settled Transactions</th>
                  <th className="pb-3 text-right font-bold">Processed gross Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {financial.byPaymentMethod.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 font-bold text-slate-800 uppercase tracking-tight">
                      {item.method ? item.method.replace(/_/g, ' ') : 'UNKNOWN'}
                    </td>
                    <td className="py-4 text-center font-bold text-slate-400">
                      {item.transactionCount} success txs
                    </td>
                    <td className="py-4 text-right font-black text-slate-900">
                      ₹{item.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KYC Verification Operational Panel Log */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
              <ShieldTick className="size-4 text-slate-400" /> Identity KYC Core Desk State
            </h4>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100/70 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">⚪ Not Initiated</span>
                <span className="text-xs font-black text-slate-800">{metrics.kycVerification.NOT_SUBMITTED || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-2">⏳ Verification Pending</span>
                <span className="text-xs font-black text-amber-700 animate-pulse">{metrics.kycVerification.PENDING_REVIEW || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-2">🛡️ Audited & Approved</span>
                <span className="text-xs font-black text-emerald-700">{metrics.kycVerification.APPROVED || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50/50 border border-red-100 p-3 rounded-xl">
                <span className="text-xs font-bold text-red-800 flex items-center gap-2">❌ Flagged / Denied</span>
                <span className="text-xs font-black text-red-700">{metrics.kycVerification.REJECTED || 0}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
}