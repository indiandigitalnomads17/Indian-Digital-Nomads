"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ShoppingBag01, EyeOff, CheckCircle } from '@untitledui/icons';

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  discountedPrice: number | null;
  coverImageUrl: string | null;
  salesTransactionCount: number;
  isDelisted: boolean;
  updatedAt: string;
  onModerationClick: (e: React.MouseEvent) => void;
}

export default function ProductListCard({
  id,
  title,
  description,
  basePrice,
  discountedPrice,
  coverImageUrl,
  salesTransactionCount,
  isDelisted,
  updatedAt,
  onModerationClick
}: ProductCardProps) {
  const router = useRouter();
  const hasDiscount = discountedPrice !== null && discountedPrice < basePrice;

  return (
    <div 
      onClick={() => router.push(`/admin/products/asset/${id}`)}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Card Header Media Container */}
        <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 shrink-0">
          <img 
            src={coverImageUrl || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-xs border backdrop-blur-xs ${
              isDelisted ? 'bg-red-50/90 text-red-700 border-red-200' : 'bg-emerald-50/90 text-emerald-700 border-emerald-200'
            }`}>
              {isDelisted ? 'Delisted Account' : 'Live Active'}
            </span>
          </div>
        </div>

        {/* Content Metadata Display Body */}
        <div className="p-4 space-y-2">
          <div>
            <h5 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{title}</h5>
            <p className="text-slate-400 text-[10px] font-medium leading-relaxed line-clamp-2 mt-0.5">{description}</p>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            {hasDiscount ? (
              <>
                <span className="text-base font-black text-slate-900">₹{discountedPrice?.toLocaleString('en-IN')}</span>
                <span className="text-xs text-slate-400 line-through font-medium">₹{basePrice.toLocaleString('en-IN')}</span>
              </>
            ) : (
              <span className="text-base font-black text-slate-900">₹{basePrice.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer Button Group Component Strip */}
      <footer className="p-4 pt-0 border-t border-slate-50 mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="size-3.5 text-slate-400" />
          {new Date(updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevents link navigation from firing when clicking moderation options
            onModerationClick(e);
          }}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
            isDelisted 
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
          }`}
        >
          {isDelisted ? 'Relist Item' : 'Delist Asset'}
        </button>
      </footer>

    </div>
  );
}