// path: src/apps/heraclitus/components/SpeedBreakdownCards.tsx

import React, { useState } from 'react'
import { FastForward, Clock, Zap } from 'lucide-react'
import type { SpeedBreakdown } from '../types'

interface SpeedBreakdownCardsProps {
  breakdowns: SpeedBreakdown[]
  selectedSpeed: number
  onSelectSpeed: (speed: number) => void
}

export const SpeedBreakdownCards: React.FC<SpeedBreakdownCardsProps> = ({
  breakdowns,
  selectedSpeed,
  onSelectSpeed,
}) => {
  const [animatingSpeed, setAnimatingSpeed] = useState<number | null>(null)

  const handleCardClick = (speed: number) => {
    setAnimatingSpeed(speed)
    onSelectSpeed(speed)
    setTimeout(() => setAnimatingSpeed(null), 300)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {breakdowns.map((item) => {
        const isSelected = selectedSpeed === item.speed
        const isNormal = item.speed === 1.0
        const isAnimating = animatingSpeed === item.speed

        return (
          <button
            key={item.speed}
            type="button"
            onClick={() => handleCardClick(item.speed)}
            className={`min-h-[96px] w-full p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between select-none relative overflow-hidden group ${
              isAnimating ? 'speed-card-select' : ''
            } ${
              isSelected
                ? 'bg-gradient-to-br from-[#261d33] via-[#1a1424] to-[#120f1a] border-[#ffd86b] shadow-[0_0_20px_rgba(255,216,107,0.22)]'
                : 'bg-[#110d18]/90 hover:bg-[#191322] border-[#2b2138] hover:border-[#4d3a66] text-[#9c93a8]'
            }`}
          >
            {/* Top row: Speed label & icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isNormal ? (
                  <Clock className={`w-4 h-4 ${isSelected ? 'text-[#ffd86b]' : 'text-[#7d7190]'}`} />
                ) : (
                  <FastForward className={`w-4 h-4 ${isSelected ? 'text-[#ffd86b]' : 'text-[#7d7190]'}`} />
                )}
                <span className={`font-mono text-sm font-black ${isSelected ? 'text-white' : 'text-[#cbd5e1]'}`}>
                  {item.speed.toFixed(2)}x
                </span>
              </div>
              {item.speed > 1.0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300">
                  <Zap className="w-2.5 h-2.5" />
                  <span>-{item.time_saved_formatted}</span>
                </div>
              )}
            </div>

            {/* Bottom row: Adjusted duration */}
            <div className="mt-2">
              <div className="text-[10px] uppercase font-cinzel tracking-wider text-[#7d7190]">
                {isNormal ? 'Standard Runtime' : `At ${item.speed.toFixed(2)}x Velocity`}
              </div>
              <div className={`font-mono text-base font-black tracking-tight mt-0.5 ${
                isSelected ? 'text-[#ffd86b]' : 'text-slate-200'
              }`}>
                {item.formatted}
              </div>
            </div>

            {/* Decorative active glow bar */}
            {isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ffd86b] via-[#f59e0b] to-[#ffd86b]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
