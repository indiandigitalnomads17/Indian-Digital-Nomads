import React from 'react';

const GigCard = ({ data, isUrgent = false }) => {
  const { title, match, time, dist, price, description } = data;

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group ${isUrgent ? 'md:col-span-2 overflow-hidden relative' : ''}`}>
      <div className={isUrgent ? 'flex flex-col md:flex-row gap-6 items-start relative z-10' : ''}>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <span className={`${isUrgent ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'} text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded`}>
              {isUrgent ? 'URGENT FILL' : `${match} Match`}
            </span>
            <span className="text-label text-xs font-bold text-outline">{time}</span>
          </div>
          
          <h3 className={`${isUrgent ? 'text-2xl font-black' : 'text-xl font-bold'} text-on-surface mb-2 group-hover:text-primary transition-colors`}>
            {title}
          </h3>

          {isUrgent && (
            <p className="text-on-surface-variant text-sm line-clamp-2 mb-4">{description}</p>
          )}

          <div className="flex items-center gap-4 text-sm font-medium text-on-surface-variant mb-6">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">location_on</span> {dist}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">payments</span> {price}</span>
            {isUrgent && <span className="text-secondary font-black">{match} Match</span>}
          </div>
        </div>

        <div className={`${isUrgent ? 'w-full md:w-48' : 'flex'} gap-3`}>
          <button className={`flex-1 py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-transform ${isUrgent ? 'bg-primary-container text-on-primary-container font-black mb-2 w-full' : 'border border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
            {isUrgent ? 'Apply Now' : 'View Details'}
          </button>
          <button className={`flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm active:scale-95 transition-transform shadow-sm ${isUrgent ? 'border border-outline-variant bg-transparent text-on-surface w-full' : ''}`}>
            {isUrgent ? 'Save Job' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GigCard;