import React from 'react';

const Stepper = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Skills' },
    { id: 3, label: 'Budget' },
  ];

  return (
    <div className="w-full max-w-2xl mb-12">
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -z-10 -translate-y-1/2"></div>
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-surface px-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              currentStep >= step.id ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant border-2 border-white'
            }`}>
              {step.id}
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${
              currentStep >= step.id ? 'text-primary' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;