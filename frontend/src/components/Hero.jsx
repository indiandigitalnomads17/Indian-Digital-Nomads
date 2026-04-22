import React from 'react';
import DarkVeil from './DarkVeil';
import BorderGlow from './BorderGlow';
import AnimatedBtn1 from './mvpblocks/animated-btn1';
import { PointerHighlight } from './ui/pointer-highlight';

const Hero = () => (
  <section className="relative pt-40 pb-32 px-8 max-w-7xl mx-auto overflow-visible flex flex-col items-center justify-center min-h-[80vh]">
    {/* Full-Width DarkVeil Background Effect */}
    <div className="absolute left-1/2 -translate-x-1/2 w-screen top-0 z-0 pointer-events-none overflow-hidden h-[800px]">
        <DarkVeil 
            lightMode={true} 
            opacity={2} 
            speed={1.5} 
            noiseIntensity={0.01}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white" />
    </div>

    {/* Centered Main Content */}
    <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto mt-8">
        
        <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tight text-[#0B1C30] leading-[1.05] mb-8">
          Hire Top Student <br className="hidden md:block" />
          Talent{' '}
          <PointerHighlight 
            rectangleClassName="bg-[#2563EB] border-[#2563EB]"
            pointerClassName="text-[#2563EB]"
          >
            <span className="text-white/95 px-2">Within 11km</span>
          </PointerHighlight>
        </h1>
        
        <p className="text-xl md:text-2xl text-[#64748B] max-w-2xl mb-16 leading-relaxed">
          Get connected via 3-minute speed calls. Fast, local, and reliable. Empowering small businesses with the energy of the next generation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-8 w-full max-w-3xl justify-center">
          {/* Card 1: Business */}
          <BorderGlow 
            className="group flex-1 p-8 shadow-xl shadow-green-500/5 transition-all cursor-pointer flex flex-col items-center text-center"
            backgroundColor="#ffffff"
            colors={['#10b981', '#34d399', '#6ee7b7']}
            glowColor="160 84 39"
            borderRadius={24}
          >

            <h3 className="font-headline text-2xl font-bold mb-2 text-[#0B1C30]">I am a Business Owner</h3>
            <p className="text-[#64748B] mb-8 text-sm">Post a gig and find talent in minutes.</p>
            <AnimatedBtn1 
              className="mt-auto shadow-lg shadow-green-500/20"
              color1="#1ab854ff"
              color2="#15803d"
              hoverColor1="#15803d"
              hoverColor2="#166534"
            >
              Hire Talent
            </AnimatedBtn1>
          </BorderGlow>
          
          {/* Card 2: Student */}
          <BorderGlow 
            className="group flex-1 p-8 shadow-xl shadow-blue-500/5 transition-all cursor-pointer flex flex-col items-center text-center"
            backgroundColor="#ffffff"
            colors={['#3b82f6', '#60a5fa', '#93c5fd']}
            glowColor="217 91 60"
            borderRadius={24}
          >

            <h3 className="font-headline text-2xl font-bold mb-2 text-[#0B1C30]">I am a Student Freelancer</h3>
            <p className="text-[#64748B] mb-8 text-sm">Monetize your skills locally today.</p>
            <AnimatedBtn1 
              className="mt-auto shadow-lg shadow-blue-500/20"
              color1="#3b82f6"
              color2="#2563EB"
              hoverColor1="#2563EB"
              hoverColor2="#1d4ed8"
            >
              Find Gigs
            </AnimatedBtn1>
          </BorderGlow>
        </div>

    </div>
  </section>
);

export default Hero;