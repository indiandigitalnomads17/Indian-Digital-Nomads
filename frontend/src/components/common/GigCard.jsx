"use client";
import React from 'react';

const GigCard = ({ data, isUrgent = false, onApply }) => {
  const { id, title, match, time, dist, price, description } = data;

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between group border border-slate-100 ${isUrgent ? 'md:col-span-2 relative border-l-4 border-l-blue-600' : ''}`}>
      <div className={isUrgent ? 'flex flex-col md:flex-row gap-6 items-start relative z-10' : ''}>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <span className={`${isUrgent ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm shadow-blue-100`}>
              {isUrgent ? 'NEW OPPORTUNITY' : `${match} Match`}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{time}</span>
          </div>
          
          <h3 className={`${isUrgent ? 'text-2xl font-black' : 'text-lg font-black'} text-slate-900 mb-2 group-hover:text-blue-600 transition-colors tracking-tight`}>
            {title}
          </h3>

          <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-4 leading-relaxed">{description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-t border-slate-50 pt-4">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-blue-500">location_on</span> {dist}</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-blue-500">payments</span> {price}</span>
            {isUrgent && <span className="text-blue-600 font-black">{match} Optimal Match</span>}
          </div>
        </div>

        <div className={`flex flex-col gap-3 ${isUrgent ? 'w-full md:w-56' : 'w-full'}`}>
          <button className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-slate-200" onClick={() => onApply(data)}>
            Quick Apply
          </button>
          <button className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default GigCard;