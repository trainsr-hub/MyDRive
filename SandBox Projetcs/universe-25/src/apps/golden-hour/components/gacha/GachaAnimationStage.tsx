// path: src/apps/golden-hour/components/gacha/GachaAnimationStage.tsx

import React, { useEffect, useRef } from 'react';
import { FastForward } from 'lucide-react';

interface GachaAnimationStageProps {
  animationSrc?: string;
  onComplete: () => void;
  packTitle?: string;
}

/**
 * GachaAnimationStage
 * Recycled universal HTML animation player from ARC Jurassic.
 * Embeds /animations/black-hole.html.
 * Click anywhere on the stage skips the animation immediately.
 */
export const GachaAnimationStage: React.FC<GachaAnimationStageProps> = ({
  animationSrc = '/animations/black-hole.html',
  onComplete,
  packTitle = 'Dimensional Genesis',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === 'GACHA_ANIMATION_COMPLETE' ||
        event.data === 'GACHA_ANIMATION_COMPLETE'
      ) {
        onComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="relative w-full min-h-[580px] flex flex-col items-center justify-center overflow-hidden bg-transparent animate-in fade-in duration-300 cursor-pointer select-none"
      title="Click anywhere to skip animation"
    >
      {/* Top Banner Status - Centered Horizontally */}
      <div className="absolute top-4 z-30 flex items-center gap-3 px-5 py-2 rounded-full bg-[#120f18]/85 border border-[#d4af37]/40 backdrop-blur-md text-xs font-mono text-[#ffd86b] shadow-xl">
        <span className="w-2 h-2 rounded-full bg-[#ffd86b] animate-ping" />
        <span className="font-cinzel font-bold">{packTitle} — Channeling Leylines...</span>
      </div>

      {/* Bottom Centered Skip Prompt */}
      <div className="absolute bottom-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-[#1c1424]/90 border border-white/20 text-[#cbd5e1] text-xs font-mono shadow-lg backdrop-blur-md hover:text-[#ffd86b] hover:border-[#d4af37] transition-all">
        <FastForward className="w-4 h-4 text-[#ffd86b]" />
        <span>Click anywhere to skip animation</span>
      </div>

      {/* Standalone Animation Iframe */}
      <iframe
        ref={iframeRef}
        src={animationSrc}
        title="Gacha Animation Stage"
        className="w-full h-[580px] border-0 outline-none bg-transparent block overflow-visible pointer-events-none"
      />

      {/* Full-Screen Click Interceptor Overlay */}
      <div className="absolute inset-0 z-20 bg-transparent" />
    </div>
  );
};

export default GachaAnimationStage;
