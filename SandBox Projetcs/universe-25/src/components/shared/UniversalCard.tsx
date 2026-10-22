import React from 'react';
import { HazardBadge } from '../HazardBadge';

interface UniversalCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  score?: number;
  rank?: string;
  type?: string;
  description?: string;
  featured?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const UniversalCard: React.FC<UniversalCardProps> = ({
  title,
  subtitle,
  icon,
  score,
  rank,
  type,
  description,
  featured = false,
  children,
  className = '',
  onClick,
  disabled = false,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-[border-color,box-shadow,transform,opacity] duration-100 ease-out hover:border-[#524124] hover:shadow-gold-sm ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer active:scale-[0.99] select-none' : ''
      }`}
      onClick={!disabled && onClick ? onClick : undefined}
    >
      {/* Left Content */}
      <div className="flex items-center gap-4">
        {/* Icon */}
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd86b]/20 ${
            featured ? 'to-[#d4af37]/30 border-[#d4af37]' : 'to-[#841822]/30 border-[#ffd86b]/40'
          } border flex items-center justify-center`}>
            {icon}
          </div>
        )}

        {/* Text Content */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#8c7a9e]">{subtitle}</p>
            )}
          </div>

          {description && (
            <p className="text-xs text-[#9c93a8] mt-1 line-clamp-2">
              {description}
            </p>
          )}

          {/* Type badge */}
          {type && (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c1424] text-[#8c7a9e] border border-[#2b2238]">
              {type}
            </span>
          )}

          {children && (
            <div className="mt-2">{children}</div>
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex items-center gap-4">
        {/* Score and Rank */}
        {score !== undefined && rank !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e1726] border border-[#3e2c54] flex items-center justify-center font-mono font-bold text-xs text-[#ffd86b]">
              #{title.toLowerCase().replace(' ', '-')}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{score}</div>
              <div className="text-xs text-[#8c7a9e]">{rank}</div>
            </div>
          </div>
        )}

        {/* HazardBadge (alternative display) */}
        {score !== undefined && rank !== undefined && (
          <HazardBadge score={score} rank={rank} size="sm" showDetails={false} />
        )}

        {/* Action indicator */}
        {onClick && !disabled && (
          <span className="text-xs font-mono text-[#ffd86b]">
            →
          </span>
        )}
      </div>
    </div>
  );
};