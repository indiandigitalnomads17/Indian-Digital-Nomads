import React from 'react';

const SpeedCallItem = ({ time, company, role, isToday = false }) => (
  <div className="bg-surface-container-lowest p-4 rounded-lg flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
    <div className={`h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center ${isToday ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-primary'}`}>
      <span className="material-symbols-outlined">videocam</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-black uppercase ${isToday ? 'text-primary' : 'text-outline'}`}>
        {time}
      </p>
      <h5 className="text-sm font-bold text-on-surface truncate">{company}</h5>
      <p className="text-xs text-on-surface-variant truncate">{role}</p>
    </div>
    <span className="material-symbols-outlined text-outline">chevron_right</span>
  </div>
);

export default SpeedCallItem;