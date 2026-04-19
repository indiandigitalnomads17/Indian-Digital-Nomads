const FreelancerCard = ({ data }) => {
  const { name, role, match, rating, dist, img } = data;
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-outline-variant/10">
      <div className="h-48 relative overflow-hidden">
        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={img} alt={name} />
        <div className="absolute top-4 right-4 bg-secondary-container text-secondary text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-tighter">
          {match} Match
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-on-surface tracking-tight font-headline">{name}</h3>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">{role}</p>
          </div>
          <div className="flex items-center gap-1 bg-surface-container text-on-surface px-2 py-1 rounded-lg">
            <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-sm font-bold">{rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-6 text-slate-500">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="text-xs font-medium">{dist} away</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-sm active:scale-95 transition-all">Message</button>
          <button className="w-12 bg-surface-container-low flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-slate-600">bookmark</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreelancerCard;