import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SubTabProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const SubTabs: React.FC<SubTabProps> = ({ tabs, activeTabId, onTabChange, className = '' }) => {
  return (
    <div className={`flex bg-[#0a0a0f]/40 backdrop-blur-sm rounded-xl p-1 border border-[#2b2238]/40 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-cinzel font-bold transition-[color,background-color,border-color,box-shadow,transform] duration-75 ease-out select-none cursor-pointer active:scale-[0.98] ${
              isActive
                ? 'bg-gradient-to-r from-[#1a1424] to-[#261b36] text-[#ffd86b] border-b-2 border-[#d4af37] shadow-gold-sm'
                : 'hover:bg-[#1a1a2e]/40 text-[#9c93a8] hover:text-white'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
