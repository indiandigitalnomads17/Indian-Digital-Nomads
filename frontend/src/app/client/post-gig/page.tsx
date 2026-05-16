import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Stepper from '../../../components/common/Stepper';
import RadiusMap from '../../../components/common/RadiusMap';

const PostGig = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center">
        <Stepper currentStep={3} />

        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <header className="mb-8">
              <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Budget & Location</h3>
              <p className="text-slate-500">Set your financial range and the broadcast radius for local talent discovery.</p>
            </header>

            <div className="space-y-10">
              {/* Budget Section */}
              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Estimated Budget Range</label>
                  <span className="text-xl font-black text-primary font-headline">$150 — $350</span>
                </div>
                <div className="relative pt-4">
                  <input className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" max="500" min="15" type="range" defaultValue="250" />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                    <span>$15</span>
                    <span>$500+</span>
                  </div>
                </div>
              </section>

              {/* Broadcast Zone Section */}
              <section className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Broadcast Zone</label>
                <RadiusMap radiusText="Tier 1: 11km Radius" locationName="Downtown Tech District, SF" />
              </section>

              {/* Actions */}
              <div className="pt-6 flex items-center justify-between gap-4">
                <button className="px-8 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">arrow_back</span> Back
                </button>
                <button className="flex-1 py-4 bg-gradient-to-br from-primary to-primary-container text-white text-sm font-extrabold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  Post Gig <span className="material-symbols-outlined text-lg">rocket_launch</span>
                </button>
              </div>
            </div>
          </div>

          {/* Trust Banners */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <TrustItem icon="verified_user" text="Local Verified Talent Only" />
            <TrustItem icon="payments" text="Escrow Protected Payments" />
          </div>
        </div>

        {/* Right Sidebar Info (Conditional/Floating) */}
        <div className="hidden lg:block fixed right-8 top-32 w-64 space-y-4">
          <ProTipCard text="Increasing your radius to 25km could connect you with 45% more qualified workers." />
          <GigSummaryCard title="UI Redesign" skills="Figma, UX" tier="Free Tier" />
        </div>
      </div>
    </DashboardLayout>
  );
};

// Internal Sub-components for cleaner code
const TrustItem = ({ icon, text }: { icon: string; text: string }) => (
  <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
    <span className="material-symbols-outlined text-secondary">{icon}</span>
    <span className="text-[11px] font-semibold text-slate-600">{text}</span>
  </div>
);

const ProTipCard = ({ text }: { text: string }) => (
  <div className="p-5 bg-secondary-container/20 rounded-2xl border border-secondary/10">
    <h4 className="font-headline font-bold text-secondary flex items-center gap-2 mb-2">
      <span className="material-symbols-outlined">lightbulb</span> Pro Tip
    </h4>
    <p className="text-xs leading-relaxed text-on-secondary-container">{text}</p>
  </div>
);

const GigSummaryCard = ({ title, skills, tier }: { title: string; skills: string; tier: string }) => (
  <div className="p-5 bg-surface-container-high rounded-2xl border border-primary/5">
    <h4 className="font-headline font-bold text-primary mb-3">Gig Summary</h4>
    <div className="space-y-3">
      <SummaryRow label="Title" value={title} />
      <SummaryRow label="Skills" value={skills} />
      <hr className="border-outline-variant/20"/>
      <SummaryRow label="Fees (0%)" value={tier} isSecondary />
    </div>
  </div>
);

const SummaryRow = ({ label, value, isSecondary }: { label: any; value: any; isSecondary?: any }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
    <span className={`text-xs font-semibold ${isSecondary ? 'text-secondary' : ''}`}>{value}</span>
  </div>
);

export default PostGig;