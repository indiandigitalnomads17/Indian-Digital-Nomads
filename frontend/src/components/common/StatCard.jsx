const StatCard = ({ label, value, suffix, trend, isTrendUp = true }) => (
  <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between min-h-[160px] group transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-outline-variant/20">
    <div className="flex justify-between items-start">
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em]">{label}</span>
      <div className="bg-secondary-container/20 text-secondary p-1 rounded-full flex items-center gap-1 px-2 py-1 text-[11px] font-bold">
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isTrendUp ? 'trending_up' : 'trending_down'}
        </span> 
        {trend}
      </div>
    </div>
    <div className="mt-4 flex items-baseline gap-2">
      <span className="text-5xl font-black text-on-surface">{value}</span>
      <span className="text-slate-400 font-semibold">{suffix}</span>
    </div>
  </div>
);

export default StatCard;