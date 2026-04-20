import React from 'react';

const Hero = () => (
  <section className="pt-40 pb-20 px-8 max-w-7xl mx-auto bg-surface">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
      {/* Left Content */}
      <div className="lg:col-span-7">
        <span className="inline-block px-4 py-1.5 mb-8 bg-[#10B981]/15 text-[#10B981] text-[0.75rem] font-bold uppercase tracking-widest rounded-full border border-[#10B981]/20">
          Hyperlocal Marketplace
        </span>
        <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tight text-[#0B1C30] leading-[1.05] mb-8">
          Hire Top Student <br />
          Talent <span className="text-[#2563EB]">Within 11km</span>
        </h1>
        <p className="text-xl text-[#64748B] max-w-xl mb-12 leading-relaxed">
          Get connected via 3-minute speed calls. Fast, local, and reliable. Empowering small businesses with the energy of the next generation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Card 1: Business */}
          <div className="group flex-1 p-8 bg-white rounded-3xl shadow-xl shadow-blue-500/5 border border-slate-100 hover:border-blue-500/20 transition-all cursor-pointer">
            <div className="mb-6 h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#2563EB]">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <h3 className="font-headline text-2xl font-bold mb-2 text-[#0B1C30]">I am a Business Owner</h3>
            <p className="text-[#64748B] mb-8 text-sm">Post a gig and find talent in minutes.</p>
            <button className="w-full py-4 bg-[#2563EB] text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
              Hire Talent
            </button>
          </div>
          
          {/* Card 2: Student */}
          <div className="group flex-1 p-8 bg-white rounded-3xl shadow-xl shadow-green-500/5 border border-slate-100 hover:border-green-500/20 transition-all cursor-pointer">
            <div className="mb-6 h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-[#10B981]">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h3 className="font-headline text-2xl font-bold mb-2 text-[#0B1C30]">I am a Student Freelancer</h3>
            <p className="text-[#64748B] mb-8 text-sm">Monetize your skills locally today.</p>
            <button className="w-full py-4 bg-[#10B981] text-white font-bold rounded-2xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 text-center">
              Find Gigs
            </button>
          </div>
        </div>
      </div>
      
      {/* Right Column: Image with Overlay */}
      <div className="lg:col-span-5 relative">
        <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-white">
          <img 
            alt="students" 
            className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgn0muGQScFt7A-rUQbPP5uCkGWgw5CAda11TexpDW9bPSTcAGkMQBapb9gy-P2K3kIUb_Y7D-ZQ7qQDFn6bPkWBZHYnjk7AkXJpXp0XhqmV3y-4zdsf58BC2FFJ4wfOu5rn-C6QLhM5bH9Iec54XpphFIJ91jzGQg4n3-g_VY_k1wwjr1NTDlfU_jbT0dQJcYE0CkKNgO__QlbDvidCE4lRnYhlsVFpBZp8voFkWsA4OgU5jTw1zl4yHVLx2Hpcp6c16m4mJGxek" 
          />
          
          {/* Profile Card Overlay */}
          <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Liam" 
                alt="Liam" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[#0B1C30] flex items-center gap-2">
                Liam ! . <span className="text-xs text-[#64748B]">• 2.4km away</span>
              </h4>
              <p className="text-[0.625rem] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                UI DESIGN SPECIALIST
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[0.6rem] font-bold rounded-md border border-blue-100 flex items-center gap-1">
                   Verified Call
                </span>
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[0.6rem] font-bold rounded-md border border-green-100">
                  New Gig
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Blur blobs for "premium" feel */}
        <div className="absolute -top-12 -right-12 h-64 w-64 bg-[#2563EB]/10 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 bg-[#10B981]/10 rounded-full blur-[80px] -z-10" />
      </div>
    </div>
  </section>
);

export default Hero;