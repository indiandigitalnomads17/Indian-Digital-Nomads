import React from 'react';

const RadiusMap = ({ radiusText, locationName }) => (
  <div className="relative group">
    <div className="w-full h-64 rounded-xl overflow-hidden relative border border-outline-variant/20">
      <img 
        className="w-full h-full object-cover grayscale opacity-40" 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkF0-Vs0nK4sSL0epa-v-3C3blm5SWLfi61pKtk3nEUAjI_pUIxcK5O9C2_tJI9sxj1LiAM8fxbMZygtOy3RIIiL9gOsZjrb1R56ZwxaN4i8wyHqLynvXRNY_RWJF9s-0cCsUS23oK-ZNevN5EJsYKEglI9i4QSg30TKSCFAjUjXouIRaCsKPAy12MlqeNpzg3uE4BMqpTYvyDN2PSoLYrCVuNCN2PYyHDLTT7BLnIaNKHs4IMxtBivn7si8J_x7u_9vVtVuEFGtc" 
        alt="Map Background" 
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 bg-blue-600/10 border-2 border-blue-600/30 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-16 h-16 bg-blue-600/20 border-2 border-blue-600/40 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-full ring-4 ring-white shadow-lg"></div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80px] bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xl">
          {radiusText}
        </div>
      </div>
    </div>
    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-white/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-md">
          <span className="material-symbols-outlined text-primary text-lg">location_on</span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Current Anchor</p>
          <p className="text-xs font-bold text-on-surface">{locationName}</p>
        </div>
      </div>
      <button className="text-xs font-bold text-primary hover:underline">Change</button>
    </div>
  </div>
);

export default RadiusMap;