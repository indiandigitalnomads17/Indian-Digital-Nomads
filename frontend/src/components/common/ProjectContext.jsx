import React from 'react';

const ProjectContext = ({ title, distance, budget, description, skills, image }) => (
  <section className="lg:col-span-5 space-y-8">
    <div className="space-y-4">
      <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full">
        Active Project
      </span>
      <h1 className="text-5xl font-extrabold tracking-tighter leading-none text-on-surface font-headline">
        {title}
      </h1>
      <div className="flex items-center gap-4 text-on-surface-variant">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">location_on</span>
          <span className="text-xs font-label uppercase">{distance} away</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">payments</span>
          <span className="text-xs font-label uppercase font-bold">{budget} Fixed</span>
        </div>
      </div>
    </div>

    <div className="p-8 bg-surface-container-low rounded-xl space-y-6">
      <div className="space-y-3">
        <h3 className="text-xs font-label uppercase tracking-widest text-primary font-bold">Project Summary</h3>
        <p className="text-on-surface-variant leading-relaxed text-sm">{description}</p>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-label uppercase tracking-widest text-primary font-bold">Required Expertise</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="px-3 py-1 bg-surface-container-highest text-on-surface text-xs font-medium rounded-lg">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg">
      <img alt="Office space" className="w-full h-full object-cover" src={image} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
        <div className="text-white">
          <p className="text-xs font-label uppercase opacity-80">Location</p>
          <p className="font-bold">Main St. Hub - Downtown District</p>
        </div>
      </div>
    </div>
  </section>
);

export default ProjectContext;