import Hero from "../components/landing-page/Hero";
import Features from "../components/landing-page/Features";
import Showcase from "../components/landing-page/Showcase";
import Testimonials from "../components/landing-page/Testimonials";
import FAQ from "../components/landing-page/FAQ";
import { UrlState } from "../context.jsx";

import { useState, useEffect } from "react";

export default function LandingPage() {
  const { isDarkMode, toggleDarkMode } = UrlState();
  const bgClass = isDarkMode ? '' : 'bg-white/20';

  const [mainStyle, setMainStyle] = useState({
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
    gap: '1rem',
    marginTop: '0.5rem',
    marginLeft:
      (window.innerWidth > 1440 && window.innerHeight > 2560)
        ? '160px'
        : (window.innerWidth >= 768
          ? '32px'
          : '0.5rem'),
    marginRight:
      (window.innerWidth > 1440 && window.innerHeight > 2560)
        ? '160px'
        : (window.innerWidth >= 768
          ? '32px'
          : '0.5rem'),
    marginBottom: '2.5rem',
  });

  useEffect(() => {
    function handleResize() {
      setMainStyle(style => ({
        ...style,
        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
        marginLeft:
          window.innerWidth > 1440
            ? '145px'
            : window.innerWidth >= 768
              ? '10px'
              : '0.5rem',
        marginRight:
          window.innerWidth > 1440
            ? '145px'
            : window.innerWidth >= 768
              ? '10px'
              : '0.5rem',
      }));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div className="min-h-screen landing-background text-gray-900 dark:text-gray-100">
      <main style={mainStyle}>
<div className={`border border-gray-300 dark:border-gray-700 rounded-lg p-4 col-span-2 flex flex-col-reverse md:flex-row items-center justify-center gap-6 mt-10 ${bgClass}`}>
          <div className={`rounded-lg p-4 col-span-2 items-center gap-6`}>
            <div className="flex-1 w-full ">
              <Hero />
            </div>
          </div>
        </div>
        <div className={`border border-gray-300 dark:border-gray-700 rounded-lg p-4 ${window.innerWidth <= 1024 ? 'col-span-2' : 'md:col-span-1'} ${bgClass}`}>
          <Features />
        </div>
        <div className={`border border-gray-300 dark:border-gray-700 rounded-lg p-4 ${window.innerWidth <= 1024 ? 'col-span-2' : 'md:col-span-1'} ${bgClass}`}>
          <Showcase />
        </div>
        <div className={`border border-gray-300 dark:border-gray-700 rounded-lg p-4 ${window.innerWidth <= 1024 ? 'col-span-2' : 'md:col-span-1'} ${bgClass}`}>
          <Testimonials />
        </div>
        <div className={`border border-gray-300 dark:border-gray-700 rounded-lg p-4 ${window.innerWidth <= 1024 ? 'col-span-2' : 'md:col-span-1'} ${bgClass}`}>
          <FAQ />
        </div>
      </main>
    </div>
  );
}
