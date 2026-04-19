const steps = [
  { id: '01', title: 'Post/Discover', icon: 'search_check', color: 'bg-primary/5', textColor: 'text-primary' },
  { id: '02', title: 'Speed Call', icon: 'video_chat', color: 'bg-secondary/5', textColor: 'text-secondary' },
  { id: '03', title: 'Secure Payment', icon: 'verified_user', color: 'bg-tertiary-container/10', textColor: 'text-tertiary' },
];

const HowItWorks = () => (
  <section className="py-24 px-8 max-w-7xl mx-auto" id="how-it-works">
    <div className="text-center max-w-3xl mx-auto mb-20">
      <h2 className="text-4xl font-headline font-extrabold mb-6">Designed for Velocity</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      {steps.map((step) => (
        <div key={step.id} className="relative p-8 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all">
          <div className={`mb-6 h-16 w-16 rounded-2xl ${step.color} flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${step.textColor} text-4xl`}>{step.icon}</span>
          </div>
          <div className="absolute top-8 right-8 text-6xl font-black opacity-10 select-none">{step.id}</div>
          <h3 className="text-xl font-headline font-bold mb-4">{step.title}</h3>
          <p className="text-on-surface-variant">Detailed description for {step.title.toLowerCase()} process.</p>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorks;