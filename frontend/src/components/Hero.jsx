const Hero = () => (
  <section className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7">
        <span className="inline-block px-4 py-1.5 mb-6 bg-secondary-container text-on-secondary-container text-[0.6875rem] font-bold uppercase tracking-widest rounded-full">
          Hyperlocal Marketplace
        </span>
        <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight text-on-surface leading-[1.1] mb-6">
          Hire Top Student Talent <span className="text-primary-container">Within 11km</span>
        </h1>
        <p className="text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
          Get connected via 3-minute speed calls. Fast, local, and reliable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Card 1 */}
          <div className="group relative flex-1 p-8 bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-primary/20 transition-all cursor-pointer">
            <div className="mb-4 h-12 w-12 rounded-lg bg-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
            </div>
            <h3 className="font-headline text-xl font-bold mb-2">I am a Business Owner</h3>
            <button className="w-full py-3 bg-primary text-white font-bold rounded-lg group-hover:bg-primary-container transition-colors">Hire Talent</button>
          </div>
          {/* Card 2 */}
          <div className="group relative flex-1 p-8 bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-secondary/20 transition-all cursor-pointer">
            <div className="mb-4 h-12 w-12 rounded-lg bg-secondary-container/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-3xl">school</span>
            </div>
            <h3 className="font-headline text-xl font-bold mb-2">I am a Student</h3>
            <button className="w-full py-3 bg-secondary text-white font-bold rounded-lg group-hover:bg-on-secondary-fixed-variant transition-colors">Find Gigs</button>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-5 relative">
        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl relative">
          <img alt="students" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgn0muGQScFt7A-rUQbPP5uCkGWgw5CAda11TexpDW9bPSTcAGkMQBapb9gy-P2K3kIUb_Y7D-ZQ7qQDFn6bPkWBZHYnjk7AkXJpXp0XhqmV3y-4zdsf58BC2FFJ4wfOu5rn-C6QLhM5bH9Iec54XpphFIJ91jzGQg4n3-g_VY_k1wwjr1NTDlfU_jbT0dQJcYE0CkKNgO__QlbDvidCE4lRnYhlsVFpBZp8voFkWsA4OgU5jTw1zl4yHVLx2Hpcp6c16m4mJGxek" />
        </div>
      </div>
    </div>
  </section>
);

export default Hero;