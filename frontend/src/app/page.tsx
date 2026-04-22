import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HowItWorks from '../components/HowItWorks';
// import Features from '../components/Features';
import FooterGlow from '../components/mvpblocks/footer-glow';
import TestimonialsCarousel from '../components/mvpblocks/testimonials-carousel';
const App = () => {
  return (
    <div className="bg-background text-foreground font-body antialiased">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        {/* <Features /> */}
        <TestimonialsCarousel />
      </main>
      <FooterGlow />
    </div>
  );
};

export default App;