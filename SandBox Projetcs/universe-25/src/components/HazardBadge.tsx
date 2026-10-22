// =============================================================================
// [GLOBAL REUSABLE COMPONENT - HAZARD & RANK BADGE WITH PROCEDURAL UNDERLAYS]
// =============================================================================
import type { FC } from 'react';
import { getRankFromScore, RANK_THEMATIC_REGISTRY } from '../utils/rank';
import type { GlobalRankTier } from '../utils/rank';

interface HazardBadgeProps {
  score: number;
  rank?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

/**
 * Ảnh chìm Rank Ψ: Sóng Thủy Triều Đại Dương Băng Giá
 */
const UnfrozenTidesUnderlay: FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] opacity-60">
    <div className="absolute inset-0 bg-gradient-to-r from-[#011422] via-[#034e7b] to-[#011422] opacity-80" />

    <div className="vfx-tide-layer-1 absolute -top-2 left-0 w-[300%] h-[150%] flex items-center">
      <svg className="w-full h-full" viewBox="0 0 600 60" preserveAspectRatio="none" fill="none">
        <path
          d="M0 35 C 50 15, 100 45, 150 25 C 200 5, 250 40, 300 20 C 350 5, 400 45, 450 25 C 500 10, 550 40, 600 25 L 600 60 L 0 60 Z"
          fill="url(#psi-wave-gradient-1)"
        />
        <path
          d="M0 35 C 50 15, 100 45, 150 25 C 200 5, 250 40, 300 20 C 350 5, 400 45, 450 25 C 500 10, 550 40, 600 25"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />
        <defs>
          <linearGradient id="psi-wave-gradient-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div className="vfx-tide-layer-2 absolute -bottom-1 left-0 w-[300%] h-[130%] flex items-center opacity-70">
      <svg className="w-full h-full" viewBox="0 0 600 50" preserveAspectRatio="none" fill="none">
        <path
          d="M0 20 C 60 38, 120 10, 180 28 C 240 42, 300 12, 360 30 C 420 45, 480 15, 540 32 L 600 20 L 600 50 L 0 50 Z"
          fill="url(#psi-wave-gradient-2)"
        />
        <path
          d="M0 20 C 60 38, 120 10, 180 28 C 240 42, 300 12, 360 30 C 420 45, 480 15, 540 32"
          stroke="#e0f2fe"
          strokeWidth="1"
          strokeOpacity="0.9"
        />
        <defs>
          <linearGradient id="psi-wave-gradient-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

// =============================================================================
// [START MODIFICATION - PROCEDURAL STATIC CIRCULAR BLACK HOLE UNDERLAY]
// 1. Black hole hình tròn tĩnh (diameter = 82% badge height, nằm yên ở trung tâm).
// 2. Chân trời sự kiện (Event Horizon) viền trắng tĩnh cố định.
// 3. Bức xạ Hawking phát sóng xung lượng tử lan tỏa ra ngoài.
// 4. Tia năng lượng Penrose cực quang phát xạ dọc theo trục kỳ dị.
// =============================================================================
const EventHorizonUnderlay: FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] flex items-center justify-center">
    {/* Deep Void Space Base */}
    <div className="absolute inset-0 bg-[#000000]" />

    {/* Penrose Relativistic Emission Jets (Tia trục phát xạ thẳng đứng từ 2 cực) */}
    <div className="vfx-penrose-jets absolute w-[1px] h-[160%] bg-gradient-to-b from-transparent via-white to-transparent opacity-80" />
    <div className="vfx-penrose-jets absolute w-[2.5px] h-[120%] bg-gradient-to-b from-transparent via-white/70 to-transparent blur-[0.8px] opacity-70" />

    {/* Static Circular Black Hole Vessel (Đường kính nhỏ hơn height thẻ ~82%) */}
    <div className="relative h-[82%] aspect-square flex items-center justify-center">
      {/* Hawking Radiation Quantum Wave 1 (Sóng bức xạ lan tỏa tầng 1) */}
      <div className="vfx-hawking-wave-1 absolute inset-0 rounded-full border border-white" />

      {/* Hawking Radiation Quantum Wave 2 (Sóng bức xạ lan tỏa tầng 2 lệch pha) */}
      <div className="vfx-hawking-wave-2 absolute inset-0 rounded-full border border-white/60" />

      {/* Penrose Ergosphere Ring (Vùng không-thời gian bị kéo xoắn phát quang tĩnh) */}
      <div className="vfx-penrose-ergosphere absolute -inset-[1.5px] rounded-full border border-white/75" />

      {/* Static Event Horizon (Chân trời sự kiện bất biến) */}
      <div className="absolute inset-0 rounded-full border-[1.5px] border-white shadow-[0_0_8px_#ffffff]" />

      {/* Static Singularity Shadow Core (Tâm hố đen tĩnh tuyệt đối) */}
      <div className="absolute inset-[1.5px] rounded-full bg-[#000000] shadow-[inset_0_0_4px_rgba(255,255,255,0.25)]" />
    </div>
  </div>
);
// =============================================================================
// [END MODIFICATION - PROCEDURAL STATIC CIRCULAR BLACK HOLE UNDERLAY]
// =============================================================================

/**
 * Ảnh chìm Rank ✦: Siêu Tân Tinh (The Star)
 */
const TheStarUnderlay: FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
    <div className="absolute inset-0 bg-gradient-to-r from-[#050401] via-[#1a1303] to-[#050401]" />

    <div className="vfx-star-corona-spin absolute inset-0 flex items-center justify-center opacity-60">
      <svg className="w-[240%] h-[450%]" viewBox="0 0 200 200">
        <g stroke="url(#star-gold-gradient)" fill="none" strokeWidth="1.5">
          <line x1="100" y1="10" x2="100" y2="190" strokeWidth="2.5" />
          <line x1="10" y1="100" x2="190" y2="100" strokeWidth="2.5" />
          <line x1="36" y1="36" x2="164" y2="164" strokeWidth="1.8" strokeDasharray="8 4" />
          <line x1="36" y1="164" x2="164" y2="36" strokeWidth="1.8" strokeDasharray="8 4" />
          <circle cx="100" cy="100" r="48" stroke="#ffd700" strokeWidth="1.5" strokeDasharray="14 6" />
        </g>
        <defs>
          <linearGradient id="star-gold-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ffd700]/30 to-[#ffffff]/40 blur-[6px] animate-pulse" />
    </div>
  </div>
);

export const HazardBadge: FC<HazardBadgeProps> = ({
  score,
  rank,
  size = 'md',
  showDetails = false,
  className = '',
}) => {
  const finalScore = isNaN(score) ? 0 : score;
  const determinedRank = (rank || getRankFromScore(finalScore)) as GlobalRankTier;

  // Only display rank badges for tiers that have been unlocked (D through ✦)
  if (determinedRank === 'F') {
    return null;
  }

  const meta = RANK_THEMATIC_REGISTRY[determinedRank] || RANK_THEMATIC_REGISTRY['C'];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1 gap-2 font-extrabold',
  }[size];

  return (
    <div
      title={`${meta.themeTitle} (${meta.description}) — Score: ${finalScore.toFixed(2)}`}
      className={`relative inline-flex items-center overflow-hidden rounded-md border backdrop-blur-md font-mono select-none transition-all duration-300 ${meta.badgeClass} ${sizeClasses} ${className}`}
    >
      {determinedRank === 'Ψ' && <UnfrozenTidesUnderlay />}
      {determinedRank === 'Ø' && <EventHorizonUnderlay />}
      {determinedRank === '✦' && <TheStarUnderlay />}

      <span className="relative z-10 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {determinedRank}
      </span>
      <span className="relative z-10 opacity-40 font-light drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        ~
      </span>
      <span className="relative z-10 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {finalScore.toFixed(2)}
      </span>

      {showDetails && (
        <span className="relative z-10 ml-1 pl-1.5 border-l border-white/30 text-[10px] uppercase opacity-90 font-sans tracking-normal font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {meta.themeTitle}
        </span>
      )}
    </div>
  );
};
