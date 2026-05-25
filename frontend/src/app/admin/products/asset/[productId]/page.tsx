"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// Premium Visual Icon Imports
import { 
  ShoppingBag01, 
  Coins01, 
  ShieldTick, 
  Calendar, 
  ArrowLeft,
  MarkerPin01,
  File06,
  LinkExternal01,
  AlertTriangle,
  Users01
} from '@untitledui/icons';

// Reuse your custom modal component seamlessly
import ProductActionModal from '@/components/admin/ProductActionModal';

// ─── DATA COMPLIANCE SCHEMA INTERFACES ────────────────────────────────────────
interface ProductDetailPayload {
  assetIdentity: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  financialSpecs: {
    basePrice: number;
    discountedPrice: number | null;
    grossRevenueGenerated: number;
    platformFeesCollected: number;
    totalSalesVolumeCount: number;
  };
  mediaAssets: {
    primaryCoverUrl: string | null;
    videoLinkUrl: string | null;
    galleryImages: Array<{ id: string; url: string; altText: string | null }>;
  };
  systemCompliance: {
    isDelisted: boolean;
    delistReason: string | null;
  };
  merchantVendorProfile: {
    id: string;
    fullName: string;
    email: string;
    nomadScore: number;
    accountStatus: string;
    profilePicLink: string | null;
    location: string;
  };
  historicalSalesLedger: Array<{
    transactionId: string;
    gatewayReferenceId: string;
    settledAmount: number;
    paymentChannelUsed: string;
    processedAt: string;
    buyerIdentity: { id: string; fullName: string; email: string } | null;
  }>;
}

export default function AdminProductDetailWorkspace() {
  const { productId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ProductDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch Aggregated Product Performance Portfolio Matrix
  const loadProductDetails = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/admin/products/asset/${productId}/details`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error compiling product operational maps:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) loadProductDetails();
  }, [productId, loadProductDetails]);

  // 2. Dispatch Live Catalog Status Overrides
  const handleStatusToggleExecution = async (actionType: 'DELIST' | 'RELIST', reason: string) => {
    const actionPath = actionType === 'DELIST' ? 'delist' : 'relist';
    try {
      const response = await api.put(`/api/v1/admin/products/${productId}/${actionPath}`, { reason });
      if (response.data.success) {
        loadProductDetails(); // Pull dynamic updates instantly to refresh states
      }
    } catch (error) {
      console.error("Failed to commit catalog visibility adjustments payload:", error);
    }
  };

  if (loading || !data) {
    return <div className="text-xs uppercase font-black tracking-widest text-slate-400 text-center py-20 animate-pulse">Defragmenting Asset Analytics Matrix...</div>;
  }

  const { assetIdentity: asset, financialSpecs: money, mediaAssets: media, systemCompliance: compliance, merchantVendorProfile: vendor, historicalSalesLedger: transactions } = data;

  return (
    <div className="space-y-8">
      {/* Upper Navigation Strip */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Merchant Profile
      </button>

      {/* ─── ROW 1: MASTER PRODUCT PORTFOLIO BANNER HEADER ─── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <img 
            src={media.primaryCoverUrl || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} 
            alt={asset.title} 
            className="w-24 h-24 object-cover rounded-2xl border bg-slate-50 shadow-xs shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{asset.title}</h2>
              <span className={`px-2 py-0.5 border text-[9px] font-black uppercase rounded-md tracking-wider ${
                compliance.isDelisted ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {compliance.isDelisted ? 'Delisted from Feed' : 'Live in Catalog'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed">{asset.description}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1 flex items-center gap-1">
              <Calendar className="size-3.5" /> First Indexed on: {new Date(asset.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Visibility Adjustment Controls */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm transition-all w-full lg:w-auto text-center ${
            compliance.isDelisted 
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
          }`}
        >
          {compliance.isDelisted ? '🔬 Rebuild & Relist' : '🛑 Delist Marketplace Asset'}
        </button>
      </div>

      {/* Delisted Warning Notice Panel */}
      {compliance.isDelisted && (
        <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex gap-3 text-xs text-red-800">
          <AlertTriangle className="size-5 shrink-0 text-red-600" />
          <div>
            <p className="font-bold">Administrative Asset Hold Policy</p>
            <p className="font-medium text-red-600/90 mt-0.5">Reason Logged: {compliance.delistReason}</p>
          </div>
        </div>
      )}

      {/* ─── ROW 2: FINANCIAL PERFORMANCE BENTO CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Gross Income Generated</p>
          <h4 className="text-2xl font-black mt-1">₹{money.grossRevenueGenerated.toLocaleString('en-IN')}</h4>
          <p className="text-[10px] text-blue-400 font-semibold mt-2">
            Platform Fees Split: ₹{money.platformFeesCollected.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Active Conversions</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{money.totalSalesVolumeCount} Downloads</h4>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShoppingBag01 className="size-5" /></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Public Core Price Tag</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">₹{money.basePrice.toLocaleString('en-IN')}</h4>
          </div>
          <span className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Coins01 className="size-5" /></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Applied Deal Price</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {money.discountedPrice !== null ? `₹${money.discountedPrice.toLocaleString('en-IN')}` : 'No Deal Active'}
            </h4>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl"><File06 className="size-5" /></span>
        </div>
      </div>

      {/* ─── ROW 3: TWO-COLUMN DATA DISTRIBUTION BLOCK ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Hand: Historical Purchase Order Ledger Grid */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Coins01 className="size-4 text-slate-400" /> Settled Sales Transaction Invoices
          </h4>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Purchaser account</th>
                    <th className="pb-3 text-center">Payment Route</th>
                    <th className="pb-3 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-slate-50/50">
                      <td className="py-3.5 font-bold text-slate-900">
                        {tx.buyerIdentity ? (
                          <>
                            <p>{tx.buyerIdentity.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{tx.buyerIdentity.email}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Anonymous Purchaser</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center font-bold text-slate-400 uppercase tracking-tight">
                        {tx.paymentChannelUsed.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 text-right font-black text-slate-900">
                        ₹{tx.settledAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-12 text-slate-400 font-bold text-xs">No customer payment flows recorded for this asset package index.</p>
          )}
        </div>

        {/* Right Hand: Sub-Model Image Gallery and Merchant Identity Info Card */}
        <div className="space-y-6">
          
          {/* Vendor Details Card Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users01 className="size-4 text-slate-400" /> Merchant Vendor Identity
            </h4>
            <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
              <img src={vendor.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} alt="" className="w-11 h-11 object-cover rounded-xl border shrink-0 bg-slate-50" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{vendor.fullName}</p>
                <p className="text-xs text-slate-400 font-semibold truncate mb-1">{vendor.email}</p>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <MarkerPin01 className="size-3.5" /> {vendor.location}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Gallery Image Slider Block Component */}
          {media.galleryImages.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Auxiliary Product Screen Shots</h4>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-3">
                {media.galleryImages.map((img) => (
                  <a href={img.url} target="_blank" rel="noreferrer" key={img.id} className="relative h-20 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 group">
                    <img src={img.url} alt={img.altText || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating Action Overlay Layer */}
      <AnimatePresence>
        {isModalOpen && (
          <ProductActionModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleStatusToggleExecution}
            productTitle={asset.title}
            isCurrentlyDelisted={compliance.isDelisted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}