"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// Premium Visual Icon Imports
import { 
  Briefcase01, 
  ShoppingBag01, 
  Star01, 
  Coins01, 
  ShieldTick, 
  MarkerPin01, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Globe01,
  Users01,
  File06,
  LinkExternal01,
  FileCheck02,
  Calendar
} from '@untitledui/icons';

// Reuse your operational selection action modal component seamlessly
import UserActionModal from '@/components/admin/FreelancerActionModal';
import KycReviewModal from '@/components/admin/KycReviewModal';
import ProductActionModal from '@/components/admin/ProductActionModal';
import ProductListCard from '@/components/admin/ProductListCard';

// ─── PAYLOAD STRUCTURAL INTERFACES ───────────────────────────────────────────
interface BusinessDetailPayload {
  accountCredentials: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    googleLinked: boolean;
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
    nomadScore: number;
    createdAt: string;
    verificationFlags: { isEmailVerified: boolean; isPhoneNumberVerified: boolean; isPlatformVerified: boolean };
  };
  kycStatusTracker: { status: string; govIdStoragePath: string | null; administrativeNotes: string | null };
  profileDetails: {
    id: string;
    bio: string | null;
    profilePicLink: string | null;
    bannerLink: string | null;
    videoIntroduction: string | null;
    locationCoordinates: { textAddress: string; latitude: number | null; longitude: number | null };
    engagementPreferences: { preferredJobType: string; hourlyBillingRate: number | null; isHourlyBilled: boolean };
    corporateTags: string[];
  } | null;
  financialLedger: {
    lifetimeGrossCapitalSpent: number;
    platformCommissionFeesContributed: number;
    netEscrowVolumeSettled: number;
    totalSuccessfulInvoicesCount: number;
    paymentMethodsBreakdown: Array<{ method: string; statusGroup: string; transactionCount: number; totalAggregatedVolume: number }>;
  };
  activityMetrics: {
    totalGigsPosted: number;
    totalProductsListed: number;
    reviewsSummary: { averageScore: number; totalCount: number };
  };
  postedGigs: Array<{ id: string; title: string; description: string; status: string; pricingType: string; budgetAllocated: number; proposalsCount: number; transactionsCount: number; createdAt: string }>;
  digitalInventory: Array<{ id: string; title: string; description: string; basePrice: number; discountedPrice: number | null; coverImageUrl: string | null; isDelisted: boolean; delistReason: string | null; salesTransactionCount: number; updatedAt: string }>;
  recentReviewsReceived: Array<{ id: string; jobId: string; rating: number; comment: string | null; createdAt: string; author: { fullName: string; email: string } }>;
}

type DetailTab = 'gigs' | 'products' | 'reviews' | 'financials';

export default function BusinessProfileDetailWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<BusinessDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('gigs');
  
  // Interactive Modal Trigger Pointers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  // Dynamic Product Moderation States Configuration
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // 1. Fetch Aggregated Business Audit Profile Data
  const loadBusinessDetails = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/admin/users/business/${id}/details`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error drawing target operation maps:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadBusinessDetails();
  }, [id, loadBusinessDetails]);

  // 2. Process Live Status Access Overrides
  const handleActionConfirm = async (action: 'SUSPEND' | 'DEACTIVATE' | 'UNSUSPEND' | 'REACTIVATE', reason: string) => {
    const base = `/api/v1/admin/users/${id}`;
    try {
      if (action === 'SUSPEND') await api.put(`${base}/suspend`, { reason });
      if (action === 'UNSUSPEND') await api.put(`${base}/unsuspend`, { reason });
      if (action === 'REACTIVATE') await api.put(`${base}/reactivate`, { reason });
      if (action === 'DEACTIVATE') await api.delete(`${base}/deactivate`, { data: { reason } });
      
      loadBusinessDetails(); 
    } catch (err) {
      console.error("Failed to apply profile parameter bounds:", err);
    }
  };

  // 3. Commit Instant KYC Verification Verdict
  const handleKycReviewExecution = async (action: 'APPROVED' | 'REJECTED', notes: string) => {
    try {
      const response = await api.put(`/api/v1/admin/kyc/${id}/review`, {
        action,
        rejectionNotes: notes || undefined
      });

      if (response.data.success) {
        loadBusinessDetails(); // Pull dynamic updates instantly to update UI status flags
      }
    } catch (error) {
      console.error("Error committing inline user verification status verdict:", error);
    }
  };

  // 4. Dispatch Asset Dislocation Status Changes
  const handleProductStatusToggle = async (actionType: 'DELIST' | 'RELIST', reason: string) => {
    if (!selectedProduct) return;
    const actionPath = actionType === 'DELIST' ? 'delist' : 'relist';
    try {
      const response = await api.put(`/api/v1/admin/products/${selectedProduct.id}/${actionPath}`, { reason });
      if (response.data.success) {
        loadBusinessDetails();
      }
    } catch (error) {
      console.error("Error dispatching admin catalog visibility modification override:", error);
    }
  };

  if (loading || !data) {
    return <div className="text-xs uppercase font-black tracking-widest text-slate-400 text-center py-20 animate-pulse">Assembling Corporate Profile Matrices...</div>;
  }

  const { accountCredentials: creds, profileDetails: profile, financialLedger: ledger, activityMetrics: stats, kycStatusTracker } = data;

  const statusBadges = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
    DEACTIVATED: 'bg-red-50 text-red-700 border-red-200'
  }[creds.status];

  return (
    <div className="space-y-8">
      {/* Back Header Bar */}
      <button 
        onClick={() => router.push('/admin/businesses')}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Directory
      </button>

      {/* ─── ROW 1: MASTER IDENTITY SUMMARY ─── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img 
            src={profile?.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} 
            alt={creds.fullName} 
            className="w-20 h-20 rounded-2xl border object-cover shadow-sm bg-slate-50"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{creds.fullName}</h2>
              <span className={`border px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${statusBadges}`}>
                {creds.status}
              </span>
              {creds.verificationFlags.isPlatformVerified && (
                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle className="size-3 fill-blue-600 text-white" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-400 mt-0.5">{creds.email} • {creds.phoneNumber || 'No phone verified'}</p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-3">
              <span className="flex items-center gap-1"><MarkerPin01 className="size-4 text-slate-400" /> {profile?.locationCoordinates.textAddress || 'Unset Location'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Star01 className="size-4 fill-amber-500 text-amber-500" /> {stats.reviewsSummary.averageScore} / 5.0 ({stats.reviewsSummary.totalCount} ratings)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score Value</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <ShieldTick className="size-4 text-blue-600" />
              <span className="text-xl font-black text-slate-900">{creds.nomadScore}</span>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm transition-all ${
              creds.status === 'ACTIVE' 
                ? 'bg-white hover:bg-red-50 text-slate-700 border-slate-200 hover:text-red-600 hover:border-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-blue-600/10'
            }`}
          >
            {creds.status === 'ACTIVE' ? 'Restrict Access' : 'Modify Access Override'}
          </button>
        </div>
      </div>

      {/* ─── ROW 2: HIGH-DENSITY COUNTER METRIC CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Lifetime Capital Invoiced</p>
          <h4 className="text-2xl font-black tracking-tight mt-1">₹{ledger.lifetimeGrossCapitalSpent.toLocaleString('en-IN')}</h4>
          <p className="text-[10px] text-blue-400 font-semibold mt-2 flex items-center gap-1">
            <Coins01 className="size-3.5" /> Fees Generated: ₹{ledger.platformCommissionFeesContributed.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Gigs Posted Pipeline</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{stats.totalGigsPosted} Work Units</h4>
          </div>
          <span className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Briefcase01 className="size-5" /></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Digital Inventory Listed</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{stats.totalProductsListed} Digital Assets</h4>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShoppingBag01 className="size-5" /></span>
        </div>
        
        {/* INTERACTIVE INLINE IDENTITY VERIFICATION CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Verification Channel Logs</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                kycStatusTracker.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                ID KYC: {kycStatusTracker.status}
              </span>
            </div>
          </div>
          
          {/* Conditional Operational Action Links Row Container */}
          <div className="mt-2 space-y-1.5">
            {kycStatusTracker.status === 'PENDING_REVIEW' && (
              <button
                type="button"
                onClick={() => setIsKycModalOpen(true)}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <FileCheck02 className="size-3.5" /> Audit Credentials
              </button>
            )}
            {kycStatusTracker.govIdStoragePath && (
              <a href={kycStatusTracker.govIdStoragePath} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center justify-center gap-1 pt-1">
                View Submitted Document <LinkExternal01 className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ─── ROW 3: TAB NAVIGATION LINK STRIP ─── */}
      <div className="border-b border-slate-200 flex items-center gap-1">
        {(['gigs', 'products', 'reviews', 'financials'] as DetailTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'gigs' && `Posted Jobs (${data.postedGigs.length})`}
            {tab === 'products' && `Store Inventory (${data.digitalInventory.length})`}
            {tab === 'reviews' && `Recieved Reviews (${data.recentReviewsReceived.length})`}
            {tab === 'financials' && 'Settled Ledger Statements'}
          </button>
        ))}
      </div>

      {/* ─── ROW 4: INTERACTIVE CONTENT STREAM ─── */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          
          {/* POSTED WORK GIGS ROW GRID */}
          {activeTab === 'gigs' && (
            <motion.div key="tab-gigs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {data.postedGigs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {data.postedGigs.map((job) => (
                    <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900 tracking-tight">{job.title}</h5>
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">{job.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-1">Pricing Format: {job.pricingType.replace('_',' ')} • Created {new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Budget</p><span className="text-sm font-black text-slate-900">₹{job.budgetAllocated.toLocaleString()}</span></div>
                        <div className="border-l border-slate-100 pl-4"><p className="text-[10px] text-slate-400 font-bold uppercase">Proposals</p><span className="text-sm font-black text-slate-900">{job.proposalsCount} Bids</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-xs text-slate-400 font-bold">No listed jobs associated with this profile account.</div>
              )}
            </motion.div>
          )}

          {/* ─── DYNAMIC STORE INVENTORY CUSTOM CARDS CAROUSEL ─── */}
          {activeTab === 'products' && (
            <motion.div key="tab-products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.digitalInventory.length > 0 ? (
                data.digitalInventory.map((prod) => (
                  <ProductListCard 
                    key={prod.id}
                    id={prod.id}
                    title={prod.title}
                    description={prod.description}
                    basePrice={prod.basePrice}
                    discountedPrice={prod.discountedPrice}
                    coverImageUrl={prod.coverImageUrl}
                    salesTransactionCount={prod.salesTransactionCount}
                    isDelisted={prod.isDelisted}
                    updatedAt={prod.updatedAt}
                    onModerationClick={() => {
                      setSelectedProduct(prod);
                      setIsProductModalOpen(true);
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-2xl text-xs text-slate-400 font-bold">No digital products registered to this seller.</div>
              )}
            </motion.div>
          )}

          {/* RECENT AUDITED USER REVIEW BOX CARDS */}
          {activeTab === 'reviews' && (
            <motion.div key="tab-reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {data.recentReviewsReceived.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.recentReviewsReceived.map((review) => (
                    <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{review.author.fullName}</span>
                          <span className="flex items-center gap-0.5 text-xs font-black text-amber-600"><Star01 className="size-3.5 fill-amber-500 text-amber-500" /> {review.rating}.0</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-2 italic leading-relaxed">"{review.comment || 'No text review comment provided.'}"</p>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold block mt-4 text-right uppercase tracking-wider">{new Date(review.createdAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-xs text-slate-400 font-bold">No reviews submitted on this user record profile yet.</div>
              )}
            </motion.div>
          )}

          {/* ESCROW SETTLED INVOICES GATEWAY CHART */}
          {activeTab === 'financials' && (
            <motion.div key="tab-financials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Coins01 className="size-4 text-slate-400" /> Payment Route Gateway Distributions</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-500">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider"><th className="pb-3">Gateway Method</th><th className="pb-3 text-center">Verification Status</th><th className="pb-3 text-center">Settled Counts</th><th className="pb-3 text-right">Aggregated Volume</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledger.paymentMethodsBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 font-bold text-slate-800 uppercase tracking-tight">{item.method ? item.method.replace(/_/g, ' ') : 'WALLET BALANCE'}</td>
                        <td className="py-3.5 text-center"><span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-2 py-0.5 border border-emerald-100 rounded-md uppercase tracking-wider">{item.statusGroup}</span></td>
                        <td className="py-3.5 text-center font-bold text-slate-400">{item.transactionCount} transactions</td>
                        <td className="py-3.5 text-right font-black text-slate-900">₹{item.totalAggregatedVolume.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* MODAL WINDOW 1: PLATFORM BAN & SUSPENSION privileges */}
      <AnimatePresence>
        {isModalOpen && (
          <UserActionModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleActionConfirm}
            freelancerName={creds.fullName}
            currentStatus={creds.status}
          />
        )}
      </AnimatePresence>

      {/* MODAL WINDOW 2: DIRECT INLINE IDENTITY VERIFICATION AUDIT DESK */}
      <AnimatePresence>
        {isKycModalOpen && (
          <KycReviewModal 
            isOpen={isKycModalOpen}
            onClose={() => setIsKycModalOpen(false)}
            onConfirm={handleKycReviewExecution}
            user={{
              id: creds.id,
              fullName: creds.fullName,
              email: creds.email,
              kycDocumentLink: kycStatusTracker.govIdStoragePath
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL WINDOW 3: DIRECT PRODUCT CATALOG MODERATION DESK */}
      <AnimatePresence>
        {isProductModalOpen && selectedProduct && (
          <ProductActionModal 
            isOpen={isProductModalOpen}
            onClose={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}
            onConfirm={handleProductStatusToggle}
            productTitle={selectedProduct.title}
            isCurrentlyDelisted={selectedProduct.isDelisted}
          />
        )}
      </AnimatePresence>

    </div>
  );
}