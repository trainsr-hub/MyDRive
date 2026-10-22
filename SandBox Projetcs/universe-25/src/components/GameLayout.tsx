// GameLayout.tsx - Base layout wrapper for individual games in Universe 25
import React from 'react'
import { useGlobalStore } from '../store/useGlobalStore'
import { useThemeStore } from '../store/useThemeStore'
import { SubTabs, type TabItem } from './SubTabs'
import { ArrowLeft, Disc3, Ticket } from 'lucide-react'

export type { TabItem }

export interface GameLayoutProps {
  children: React.ReactNode
  className?: string
  showHeader?: boolean
  title?: string
  gameTitle?: string
  gameTitleIcon?: React.ReactNode
  gameTitleBadge?: string
  gameTitleSubtitle?: string
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  globalInfo?: {
    hazardLevel?: number
    goldenHours?: number
    discs?: number
    tickets?: number
    angelRollTickets?: number
    [key: string]: any
  }
  headerRight?: React.ReactNode
  showBackButton?: boolean
  backButton?: boolean | string
  onBackClick?: () => void
  backButtonLabel?: string
}

export function GameLayout({
  children,
  className = '',
  showHeader = true,
  title,
  gameTitle = 'Universe 25 Game',
  gameTitleIcon,
  gameTitleBadge,
  gameTitleSubtitle,
  tabs,
  activeTab,
  onTabChange,
  globalInfo,
  headerRight,
  showBackButton = false,
  backButton,
  onBackClick,
  backButtonLabel = 'Back',
}: GameLayoutProps) {
  const setActiveApp = useGlobalStore((s) => s.setActiveApp)
  const activeThemeId = useThemeStore((s) => s.activeThemeId)

  const displayTitle = title || gameTitle
  const hasBackButton = showBackButton || Boolean(backButton)
  const backLabel = typeof backButton === 'string' ? backButton : (backButtonLabel !== 'Back' ? backButtonLabel : 'Golden Hour')

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      setActiveApp('golden-hour')
    }
  }

  return (
    <div className={`min-h-screen w-full portal-backdrop text-[#f5f0e8] font-inter ${className}`}>
      {showHeader && (
        <header className="border-b border-[#2d2438] bg-[#0a080e]/90 backdrop-blur-md px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left Side: Back Button, Game Title, and Subtitle */}
            <div className="flex items-center gap-4 flex-wrap">
              {hasBackButton && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold bg-[#14101c] hover:bg-[#20192e] border border-[#2e2638] hover:border-[#d4af37] text-[#cbd5e1] hover:text-white transition shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{backLabel}</span>
                </button>
              )}

              <div className="flex items-center gap-3">
                {gameTitleIcon && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffd86b] via-[#d4af37] to-[#f97316] p-0.5 shadow-gold-md flex items-center justify-center">
                    <div className="w-full h-full bg-[#120f18] rounded-[14px] flex items-center justify-center text-lg">
                      {gameTitleIcon}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-cinzel text-xl font-bold tracking-wider text-white">
                      {displayTitle}
                    </h1>
                    {gameTitleBadge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ffd86b]/10 text-[#ffd86b] border border-[#ffd86b]/30">
                        {gameTitleBadge}
                      </span>
                    )}
                  </div>

                  {gameTitleSubtitle && (
                    <p className="text-[11px] text-[#8c7a9e]">
                      {gameTitleSubtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Center/Right Side: Custom Header Right OR Default Global Info & Theme */}
            <div className="flex items-center gap-4 text-xs font-mono text-[#9c93a8] flex-wrap">
              {headerRight ? (
                headerRight
              ) : (
                <>
                  {globalInfo && (
                    <div className="flex items-center gap-3">
                      {globalInfo.discs !== undefined && (
                        <div className="flex items-center gap-2 bg-[#14101c] px-3.5 py-1.5 rounded-xl border border-[#2e2638] text-xs font-mono font-bold text-[#ffd86b] shadow-sm">
                          <Disc3 className="w-4 h-4 text-[#ffd86b]" />
                          <span>{globalInfo.discs} Discs</span>
                        </div>
                      )}
                      {(globalInfo.tickets !== undefined || globalInfo.angelRollTickets !== undefined) && (
                        <div className="flex items-center gap-2 bg-[#1c1424] px-3.5 py-1.5 rounded-xl border border-[#4a3461] text-xs font-mono font-bold text-[#c084fc] shadow-sm">
                          <Ticket className="w-4 h-4 text-[#c084fc]" />
                          <span>{globalInfo.tickets ?? globalInfo.angelRollTickets} Tickets</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Theme Display */}
                  <div className="flex items-center gap-2 pl-4 border-l border-[#2d2438]">
                    <span>Theme:</span>
                    <span className="font-bold text-[#ffd86b]">{activeThemeId}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          {tabs && tabs.length > 0 && (
            <div className="mt-4 max-w-7xl mx-auto">
              <SubTabs
                tabs={tabs}
                activeTabId={activeTab || ''}
                onTabChange={onTabChange || (() => {})}
                className="bg-[#0a0a0f]/40 backdrop-blur-sm rounded-xl p-1 border border-[#2b2238]/40"
              />
            </div>
          )}
        </header>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  )
}
