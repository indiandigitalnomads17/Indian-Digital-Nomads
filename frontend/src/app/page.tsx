import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HowItWorks from '../components/HowItWorks';
// import Features from '../components/Features';
import Footer from '../components/Footer';

const App = () => {
  return (
    <div className="bg-surface text-on-surface font-body antialiased">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        {/* <Features /> */}
      </main>
      <Footer />
    </div>
  );
};

export default App;