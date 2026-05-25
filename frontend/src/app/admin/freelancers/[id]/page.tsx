"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// Premium Visual Icon Imports
import { 
  Briefcase01, 
  Star01, 
  Coins01, 
  ShieldTick, 
  MarkerPin01, 
  ArrowLeft,
  CheckCircle,
  File06,
  LinkExternal01,
  FileCheck02,
  Calendar,
  LayersTwo01
} from '@untitledui/icons';

// Reuse modular structural components
import UserActionModal from '@/components/admin/FreelancerActionModal';
import KycReviewModal from '@/components/admin/KycReviewModal';

// ─── STRUCTURAL TYPE INTERFACES ──────────────────────────────────────────────
interface FreelancerDetailPayload {
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
    videoIntroUrl: string | null;
    locationContext: { textAddress: string; latitude: number | null; longitude: number | null };
    billingPreferences: { hourlyRate: number | null; isHourlyActive: boolean; preferredJobType: string };
    skillsTags: string[];
    portfolioProjects: Array<{ id: string; title: string; description: string | null; links: string[]; videoUrl: string | null; completedAt: string | null; skillsUsed: string[]; mediaGallery: Array<{ id: string; url: string; altText: string | null }> }>;
  } | null;
  earningsLedger: {
    lifetimeGrossRevenueEarned: number;
    platformCommissionFeesContributed: number;
    netEarningOutflowCleared: number;
    totalSuccessfulPayoutsCount: number;
  };
  activityMetrics: {
    proposalsStats: { totalFiled: number; totalAccepted: number; conversionRatio: number };
    contractsStats: { totalContractsAssigned: number; activeContractsCount: number; completedContractsCount: number };
    reviewsStats: { averageScore: number; totalCount: number };
  };
  contractsHistory: Array<{ id: string; title: string; status: string; pricingType: string; contractValue: number; createdAt: string; client: { fullName: string; email: string } }>;
  proposalsHistory: Array<{ id: string; coverLetterSnippet: string; bidAmount: number; estimatedDays: number | null; status: string; createdAt: string; targetJob: { title: string; originalBudget: number; currentJobStatus: string } }>;
  recentReviewsReceived: Array<{ id: string; rating: number; comment: string | null; createdAt: string; reviewer: { fullName: string; email: string } }>;
}

type TalentTab = 'contracts' | 'proposals' | 'portfolio' | 'reviews';

export default function FreelancerProfileDetailWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<FreelancerDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TalentTab>('contracts');
  
  // Interactive Modals Toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  // 1. Fetch Aggregated Freelancer Audit Data
  const loadFreelancerDetails = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/admin/users/freelancer/${id}/details`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error drawing freelancer analytics maps:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadFreelancerDetails();
  }, [id, loadFreelancerDetails]);

  // 2. Process Core Account Restrictions Overrides
  const handleActionConfirm = async (action: 'SUSPEND' | 'DEACTIVATE' | 'UNSUSPEND' | 'REACTIVATE', reason: string) => {
    const base = `/api/v1/admin/users/${id}`;
    try {
      if (action === 'SUSPEND') await api.put(`${base}/suspend`, { reason });
      if (action === 'UNSUSPEND') await api.put(`${base}/unsuspend`, { reason });
      if (action === 'REACTIVATE') await api.put(`${base}/reactivate`, { reason });
      if (action === 'DEACTIVATE') await api.delete(`${base}/deactivate`, { data: { reason } });
      
      loadFreelancerDetails(); 
    } catch (err) {
      console.error("Failed to commit profile limits parameters:", err);
    }
  };

  // 3. Process Instant KYC Identity Approvals
  const handleKycReviewExecution = async (action: 'APPROVED' | 'REJECTED', notes: string) => {
    try {
      const response = await api.put(`/api/v1/admin/kyc/${id}/review`, { action, rejectionNotes: notes || undefined });
      if (response.data.success) {
        loadFreelancerDetails(); // FIXED: Points correctly to freelancer layout sync method to clear TS bounds
      }
    } catch (error) {
      console.error("Error committing inline user verification status verdict:", error);
    }
  };

  if (loading || !data) {
    return <div className="text-xs uppercase font-black tracking-widest text-slate-400 text-center py-20 animate-pulse">Defragmenting Talent Profile Matrices...</div>;
  }

  const { accountCredentials: creds, profileDetails: profile, earningsLedger: ledger, activityMetrics: stats, kycStatusTracker } = data;
  const statusBadges = { ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200', SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200', DEACTIVATED: 'bg-red-50 text-red-700 border-red-200' }[creds.status];

  return (
    <div className="space-y-8">
      {/* Return Navigation Anchor */}
      <button 
        onClick={() => router.push('/admin/freelancers')}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Directory
      </button>

      {/* ─── HEADER IDENTITY INFORMATION ROW ─── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img 
            src={profile?.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} 
            alt="" 
            className="w-20 h-20 rounded-2xl border object-cover shadow-sm bg-slate-50 shrink-0"
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
              <span className="flex items-center gap-1"><MarkerPin01 className="size-4 text-slate-400" /> {profile?.locationContext.textAddress || 'Unset Location'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Star01 className="size-4 fill-amber-500 text-amber-500" /> {stats.reviewsStats.averageScore} / 5.0 ({stats.reviewsStats.totalCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Action Controls Column Stack */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score Index</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <ShieldTick className="size-4 text-blue-600" />
              <span className="text-xl font-black text-slate-900">{creds.nomadScore}</span>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm transition-all ${
              creds.status === 'ACTIVE' 
                ? 'bg-white hover:bg-red-50 text-slate-700 border-slate-200 hover:text-red-600' 
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
            }`}
          >
            {creds.status === 'ACTIVE' ? 'Take Action' : 'Update Privilege Override'}
          </button>
        </div>
      </div>

      {/* ─── HIGH-DENSITY COUNTER METRIC CARDS GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Lifetime Gross Earnings</p>
          <h4 className="text-2xl font-black tracking-tight mt-1">₹{ledger.lifetimeGrossRevenueEarned.toLocaleString('en-IN')}</h4>
          <p className="text-[10px] text-emerald-400 font-semibold mt-2">
            Net Clearance Payload: ₹{ledger.netEarningOutflowCleared.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Contracts Conversion</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{stats.contractsStats.completedContractsCount} Completed</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">{stats.contractsStats.activeContractsCount} processing contracts</p>
          </div>
          <span className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Briefcase01 className="size-5" /></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Bidding Conversion Rate</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{stats.proposalsStats.conversionRatio}% Win</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">{stats.proposalsStats.totalFiled} proposals submitted</p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl"><LayersTwo01 className="size-5" /></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Identity KYC Verification</p>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block border mt-1.5 ${
              kycStatusTracker.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {kycStatusTracker.status}
            </span>
          </div>
          <div className="mt-2">
            {kycStatusTracker.status === 'PENDING_REVIEW' && (
              <button type="button" onClick={() => setIsKycModalOpen(true)} className="w-full py-1.5 bg-emerald-600 text-white font-black uppercase text-[9px] tracking-wider rounded-lg flex items-center justify-center gap-1"><FileCheck02 className="size-3.5" /> Pass Credentials</button>
            )}
            {kycStatusTracker.govIdStoragePath && (
              <a href={kycStatusTracker.govIdStoragePath} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center justify-center gap-1 pt-1.5">View Vault ID File <LinkExternal01 className="size-3" /></a>
            )}
          </div>
        </div>
      </div>

      {/* Bio Description Details */}
      {profile?.bio && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Professional Background Bio</h4>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">{profile.bio}</p>
          {profile.skillsTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-4 border-t border-slate-50 mt-4">
              {profile.skillsTags.map(tag => (
                <span key={tag} className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB STRIP SELECTOR NAVIGATION ─── */}
      <div className="border-b border-slate-200 flex items-center gap-1">
        {(['contracts', 'proposals', 'portfolio', 'reviews'] as TalentTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'contracts' && `Assigned Contracts (${data.contractsHistory.length})`}
            {tab === 'proposals' && `Bids Registry (${data.proposalsHistory.length})`}
            {tab === 'portfolio' && `Portfolio Cases (${profile?.portfolioProjects.length || 0})`}
            {tab === 'reviews' && `Client Ratings (${data.recentReviewsReceived.length})`}
          </button>
        ))}
      </div>

      {/* ─── INTERACTIVE CONTENT TABS CONTENT STREAM ─── */}
      <div className="min-h-[350px]">
        <AnimatePresence mode="wait">
          
          {/* TAB BLOCK 1: ASSIGNED CONTRACTS HUB */}
          {activeTab === 'contracts' && (
            <motion.div key="tab-contracts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {data.contractsHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {data.contractsHistory.map(contract => (
                    <div key={contract.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900 tracking-tight">{contract.title}</h5>
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">{contract.status}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-1">Employer Client: {contract.client.fullName} ({contract.client.email})</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contract Budget</p>
                        <span className="text-base font-black text-slate-900">₹{contract.contractValue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-400">No managed work contracts linked onto this profile yet.</div>
              )}
            </motion.div>
          )}

          {/* TAB BLOCK 2: HISTORICAL SUBMITTED PROPOSALS INDEX */}
          {activeTab === 'proposals' && (
            <motion.div key="tab-proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {data.proposalsHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {data.proposalsHistory.map(prop => (
                    <div key={prop.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-50 pb-2 flex-wrap gap-2">
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 tracking-tight">{prop.targetJob.title}</h5>
                          <p className="text-[10px] text-slate-400 font-medium">Original Listed Budget: ₹{prop.targetJob.originalBudget.toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 border text-[9px] font-black rounded-md uppercase ${
                          prop.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : prop.status === 'PENDING' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>{prop.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 italic leading-relaxed">"{prop.coverLetterSnippet}"</p>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1">
                        <span>Bid Offering Amount: <strong className="text-slate-900 text-xs font-black">₹{prop.bidAmount.toLocaleString()}</strong></span>
                        <span>Delivery Timeline: <strong className="text-slate-700 text-xs font-black">{prop.estimatedDays || 'Unset'} Days</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-400">No active or historic marketplace bids submitted.</div>
              )}
            </motion.div>
          )}

          {/* TAB BLOCK 3: CASE STUDY PORTFOLIO WORKS SHOWCASES */}
          {activeTab === 'portfolio' && (
            <motion.div key="tab-portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile?.portfolioProjects && profile.portfolioProjects.length > 0 ? (
                profile.portfolioProjects.map(proj => (
                  <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      {proj.mediaGallery.length > 0 && (
                        <div className="h-40 bg-slate-100 rounded-xl overflow-hidden border mb-3"><img src={proj.mediaGallery[0].url} alt="" className="w-full h-full object-cover" /></div>
                      )}
                      <h5 className="text-sm font-black text-slate-900 tracking-tight">{proj.title}</h5>
                      <p className="text-xs text-slate-400 font-medium mt-1 line-clamp-2 leading-relaxed">{proj.description}</p>
                    </div>
                    {proj.skillsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-3 border-t border-slate-50 mt-4">
                        {proj.skillsUsed.slice(0, 4).map(s => <span key={s} className="bg-slate-50 border text-slate-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">{s}</span>)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-400">No custom portfolio showpieces added by this user.</div>
              )}
            </motion.div>
          )}

          {/* TAB BLOCK 4: REVIEWS RECEIVED */}
          {activeTab === 'reviews' && (
            <motion.div key="tab-reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recentReviewsReceived.length > 0 ? (
                data.recentReviewsReceived.map(review => (
                  <div key={review.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-900">{review.reviewer.fullName}</span><span className="flex items-center gap-0.5 text-xs font-black text-amber-500"><Star01 className="size-3.5 fill-amber-500 text-amber-500" /> {review.rating}.0</span></div>
                      <p className="text-xs text-slate-500 font-medium mt-2 italic leading-relaxed">"{review.comment || 'No feedback comments noted.'}"</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold block mt-4 text-right uppercase tracking-wider">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-400">No corporate performance evaluations or ratings logged.</div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ─── DYNAMIC ADMIN OVERLAY DIALOG DRAWERS ─── */}
      <AnimatePresence>
        {isModalOpen && <UserActionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleActionConfirm} freelancerName={creds.fullName} currentStatus={creds.status} />}
        {isKycModalOpen && <KycReviewModal isOpen={isKycModalOpen} onClose={() => setIsKycModalOpen(false)} onConfirm={handleKycReviewExecution} user={{ id: creds.id, fullName: creds.fullName, email: creds.email, kycDocumentLink: kycStatusTracker.govIdStoragePath }} />}
      </AnimatePresence>
    </div>
  );
}