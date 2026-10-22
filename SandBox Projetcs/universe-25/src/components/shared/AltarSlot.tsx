import React from 'react';

interface AltarSlotProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  cost?: {
    type: 'disc' | 'ticket' | 'time';
    amount: number;
  };
  onAction?: () => void;
  disabled?: boolean;
  loading?: boolean;
  featuredItem?: {
    name: string;
    score: number;
    rank: string;
    type: string;
  };
  children?: React.ReactNode;
  className?: string;
}

export const AltarSlot: React.FC<AltarSlotProps> = ({
  title,
  description,
  icon,
  cost,
  onAction,
  disabled = false,
  loading = false,
  featuredItem,
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center transition-[border-color,box-shadow,opacity] duration-100 ease-out ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#ffd86b]/40 hover:shadow-gold-sm'
      }`}
    >
      {/* Icon */}
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffd86b]/20 to-[#841822]/30 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-[#8c7a9e] mb-4 max-w-md">
          {description}
        </p>
      )}

      {/* Featured Item Display */}
      {featuredItem && (
        <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-[#14101c] border border-[#2a2034]">
          <div className="w-8 h-8 rounded-lg bg-[#1e1726] border border-[#3e2c54] flex items-center justify-center font-mono font-bold text-xs text-[#ffd86b]">
            #{featuredItem.name.replace('item-', '#0')}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{featuredItem.name}</div>
            <div className="text-xs text-[#8c7a9e]">{featuredItem.type}</div>
          </div>
          <div className="flex items-center gap-4">
            {/* HazardBadge would be imported here */}
            <span className="text-xs font-mono">Score: {featuredItem.score}</span>
            <span className="text-xs font-mono">Rank: {featuredItem.rank}</span>
          </div>
        </div>
      )}

      {/* Cost Display */}
      {cost && (
        <div className="flex items-center gap-2 text-xs font-mono mb-4">
          {cost.type === 'disc' && (
            <>
              <span className="text-[#ffd86b]">•</span>
              <span className="text-white">{cost.amount}</span>
              <span className="text-[#8c7a9e]">Discs</span>
            </>
          )}
          {cost.type === 'ticket' && (
            <>
              <span className="text-[#ffd86b]">🎟️</span>
              <span className="text-white">{cost.amount}</span>
              <span className="text-[#8c7a9e]">Tickets</span>
            </>
          )}
          {cost.type === 'time' && (
            <>
              <span className="text-[#ffd86b]">⏱️</span>
              <span className="text-white">{cost.amount}s</span>
              <span className="text-[#8c7a9e]">Time</span>
            </>
          )}
        </div>
      )}

      {/* Action Button or Children */}
      {onAction ? (
        <button
          className="w-full px-5 py-2.5 rounded-xl font-cinzel font-bold text-sm transition-[transform,opacity,background-color,box-shadow] duration-75 ease-out active:scale-[0.98] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          disabled={disabled || loading}
          onClick={disabled || loading ? undefined : onAction}
          style={{
            backgroundColor: loading ? undefined : '#ffd86b',
            color: loading ? '#ffffff' : '#000000',
          }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 inline animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="80" strokeDashoffset="0" />
              </svg>
              <span className="ml-2">Processing...</span>
            </>
          ) : (
            <span>Activate</span>
          )}
        </button>
      ) : (
        <div className="w-full">{children}</div>
      )}
    </div>
  );
};