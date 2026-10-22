import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { THEMES_REGISTRY } from '../../themes/themes.registry';
import { Palette } from 'lucide-react';

interface ConfigSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  showThemeSelector?: boolean;
  className?: string;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  description,
  icon,
  children,
  showThemeSelector = true,
  className = '',
}) => {
  const { activeThemeId, setActiveTheme, unlockedThemeIds } = useThemeStore();

  return (
    <div className={`p-6 rounded-2xl bg-[#0e0a16]/80 border border-[#2e2638] space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd86b]/20 to-[#9333ea]/30 border border-[#c084fc]/40 flex items-center justify-center text-[#c084fc]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[#8c7a9e]">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Theme Selector */}
      {showThemeSelector && (
        <div className="space-y-4">
          <label className="block text-xs font-cinzel font-bold text-[#ffd86b] uppercase tracking-wider">
            Active Visual Theme (Shared Store)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(THEMES_REGISTRY).map(([id, theme]) => {
              const isSelected = activeThemeId === id;
              const isUnlocked = unlockedThemeIds.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => setActiveTheme(id)}
                  disabled={!isUnlocked}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1c1424] border-[#ffd86b] shadow-gold-sm'
                      : 'bg-[#120f18] border-[#2b2238] hover:border-[#524124]'
                  } ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{theme.name}</span>
                    <Palette className={`w-4 h-4 ${isSelected ? 'text-[#ffd86b]' : 'text-[#8c7a9e]'}`} />
                  </div>
                  <span className="text-[11px] text-[#8c7a9e] font-mono">ID: {id}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Custom Configuration Content */}
      {children}
    </div>
  );
};