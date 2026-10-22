import React from 'react';

interface TelemetryBarProps {
  hazardLevel: number;
  goldenHours: number;
  discs: number;
  tickets: number;
  themeVariant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  hazardLevel,
  goldenHours,
  discs,
  tickets,
  themeVariant = 'default',
  className = '',
}) => {
  // Format hazard level with 2 decimal places
  const formattedHazard = hazardLevel.toFixed(2);

  // Format golden hours (convert from seconds to hours if needed)
  const formattedGoldenHours = goldenHours >= 1
    ? goldenHours.toFixed(1)
    : (goldenHours * 60).toFixed(0) + 'm';

  return (
    <div className={`flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-300 hover:border-[#ffd86b]/40 hover:shadow-gold-sm ${className}`}>
      {/* Hazard Level */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[#ffd86b]">⚡</span>
        <span className="text-white">{formattedHazard}</span>
      </div>

      {/* Golden Hours */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[#ffd86b]">⏱️</span>
        <span className="text-white">{formattedGoldenHours}</span>
      </div>

      {/* Discs */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[#ffd86b]">💿</span>
        <span className="text-white">{discs}</span>
      </div>

      {/* Tickets */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[#ffd86b]">🎟️</span>
        <span className="text-white">{tickets}</span>
      </div>

      {/* Variant-specific additions */}
      {themeVariant === 'detailed' && (
        <>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#ffd86b]">📊</span>
            <span className="text-white">System Online</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#ffd86b]">🔗</span>
            <span className="text-white">Backend Synced</span>
          </div>
        </>
      )}
    </div>
  );
};