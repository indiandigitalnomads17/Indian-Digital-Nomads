import React from 'react';
import BentoGrid from './mvpblocks/bento-grid-2';

const steps = [
  { 
    title: 'Post/Discover', 
    description: 'Quickly post a gig or discover local opportunities in seconds.',
    icon: <span className="material-symbols-outlined text-primary text-xl">search_check</span>,
    status: 'Step 01',
    tags: ['Find Talent', 'Get Hired'],
    colSpan: 1,
  },
  { 
    title: 'Speed Call', 
    description: 'Connect instantly via a 3-minute video speed call to ensure a perfect match.',
    icon: <span className="material-symbols-outlined text-secondary text-xl">video_chat</span>,
    status: 'Step 02',
    tags: ['Fast', 'Reliable'],
    colSpan: 1,
    hasPersistentHover: true,
  },
  { 
    title: 'Secure Payment', 
    description: 'Complete the job and get paid securely without leaving the platform.',
    icon: <span className="material-symbols-outlined text-tertiary text-xl">verified_user</span>,
    status: 'Step 03',
    tags: ['Safe', 'Guaranteed'],
    colSpan: 1,
  },
];

const HowItWorks = () => (
  <section className="py-24 w-full px-4 md:px-8" id="how-it-works">
    <div className="text-center max-w-3xl mx-auto mb-8">
      <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-[#0B1C30] mb-6">Designed for Velocity</h2>
      <p className="text-xl text-[#64748B]">Our streamlined process is built for speed and reliability.</p>
    </div>
    <BentoGrid items={steps} />
  </section>
);

export default HowItWorks;