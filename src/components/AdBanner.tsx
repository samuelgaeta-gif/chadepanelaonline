import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdBanner({ slotId = "6978283951", format = "auto" }: { slotId?: string, format?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous child to ensure clean mount
    containerRef.current.innerHTML = '';

    // Delay to guarantee layout paints and width > 0
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.style.width = '100%';
      ins.style.minWidth = '250px';
      ins.style.minHeight = '90px'; // guarantees size if format="auto" delays
      ins.dataset.adClient = 'ca-pub-8710756806401980';
      ins.dataset.adSlot = slotId;
      ins.dataset.adFormat = format;
      ins.dataset.fullWidthResponsive = 'true';

      containerRef.current.appendChild(ins);

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e: any) {
        if (!String(e).includes('already have ads')) {
          console.warn('Google Ads warning:', e);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [slotId, format]);

  return (
    <div className="w-full bg-slate-50/50 border border-slate-100 rounded-xl flex flex-col items-center justify-center p-3 overflow-hidden shadow-sm">
      <span className="mb-2 uppercase tracking-widest text-[10px] text-slate-400 font-medium">Publicidade</span>
      <div 
        ref={containerRef} 
        className="w-full min-w-[250px] min-h-[90px] flex justify-center text-center items-center relative"
      >
        {/* Adds block inside container */}
      </div>
    </div>
  );
}

