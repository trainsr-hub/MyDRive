// path: src/apps/heraclitus/Heraclitus.tsx

import React, { useState } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { DurationCalcTab } from './components/DurationCalcTab'
import { YellowPoolTab } from './components/YellowPoolTab'
import { Flame, Clock, Droplet, Sparkles } from 'lucide-react'

type HeraclitusTab = 'duration-calc' | 'yellow-pool'

export const Heraclitus: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HeraclitusTab>('duration-calc')

  const tabs = [
    {
      id: 'duration-calc',
      label: 'Duration Calc',
      icon: <Clock className="w-4 h-4 text-[#ffd86b]" />,
    },
    {
      id: 'yellow-pool',
      label: 'Yellow Pool',
      icon: <Droplet className="w-4 h-4 text-[#ffd86b]" />,
    },
  ]

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-[#0c0914] text-[#f5f0e8]">
      <GameLayout
        showBackButton={true}
        backButtonLabel="Golden Hour"
        title="Heraclitus"
        gameTitle="Heraclitus"
        gameTitleIcon={<Flame className="w-5 h-5 text-amber-400 animate-pulse" />}
        gameTitleBadge="PANTA RHEI"
        gameTitleSubtitle="Eternal Flux & Chrono Engine • Universal Media Velocity Nexus"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as HeraclitusTab)}
        headerRight={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171124] border border-[#372a4d] text-xs font-mono text-[#ffd86b]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CHRONO ENGINE ONLINE</span>
          </div>
        }
      >
        {activeTab === 'duration-calc' && <DurationCalcTab />}
        {activeTab === 'yellow-pool' && <YellowPoolTab />}
      </GameLayout>
    </div>
  )
}

export default Heraclitus
