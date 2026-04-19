import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import ProjectContext from '../../../components/common/ProjectContext';
import QuotationForm from '../../../components/forms/QuotationForm';

const PROJECT_DATA = {
  title: "UI/UX Consultant - Main St. Hub",
  distance: "0.5km",
  budget: "$1,200",
  skills: ["Figma", "User Research", "Tailwind CSS", "Prototyping"],
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMHrm_EogfxvFImm86z7oyUkvl862cDHWVzpcSFJr5DdL2HWVeQOFi_ocVWxbaLI4am8ZmtKoYXsAFUMUYsk78yNxKTc3gAouPNHttwiCcZJrENXHb0zcptxsr4ui6anPw0fB0gOdL_crDtPZ7zSkoQPEMIAR1SOf4zlSz2SfMgmAiNrqJx_n_kr7sGX4EgwH-jAtRKvznyL_AO3CQ0gD2oqky4BOp8uLeVmlNhmfi-EQ8Yw3qYoERYtGHOWbg4gR8l8xypZf8OCs",
  description: "We are seeking a highly skilled UI/UX Consultant to refine the digital experience for the Main St. Hub community platform. This role requires a balance of creative vision and technical precision."
};

const SubmitQuote = () => {
  return (
    <DashboardLayout>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-8 text-on-surface-variant">
        <span className="text-xs font-label uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Browse Gigs</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-xs font-label uppercase tracking-widest text-primary font-bold">Submit Quotation</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <ProjectContext {...PROJECT_DATA} />

        <section className="lg:col-span-7">
          <QuotationForm />
          
          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-between px-2">
            <div className="flex -space-x-2">
              {[12, 13, 14].map((id) => (
                <img 
                  key={id} 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                  src={`http://googleusercontent.com/profile/picture/${id}`} 
                  alt="Reviewer" 
                />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                +12
              </div>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              12 other freelancers have quoted for this project
            </p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default SubmitQuote;