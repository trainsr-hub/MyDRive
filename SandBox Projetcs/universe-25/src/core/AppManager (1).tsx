// path: src/core/AppManager.tsx

import { useGlobalStore } from '../store/useGlobalStore'
import { ImperialHeader } from '../components/ImperialHeader'
import { GoldenHour } from '../apps/golden-hour/GoldenHour'
import { VinylAngel } from '../apps/vinyl-angel/VinylAngel'
import { ArcJurassic } from '../apps/arc-jurassic/ArcJurassic'

/**
 * AppManager renders ALL active registered apps simultaneously.
 * Toggles visibility via CSS display: none / block.
 *
 * This guarantees:
 * - Components are NEVER unmounted
 * - Zero re-render cost when switching tabs
 * - Local component state, timers, scroll position perfectly preserved
 */
export function AppManager() {
  const activeApp = useGlobalStore((s) => s.activeApp)

  return (
    <div className="w-full min-h-screen portal-backdrop text-[#f5f0e8] font-inter selection:bg-[#d4af37] selection:text-black">
      <ImperialHeader />

      <div className="w-full">
        <div className={activeApp === 'golden-hour' ? 'app-visible' : 'app-hidden'}>
          <GoldenHour />
        </div>

        <div className={activeApp === 'vinyl-angel' ? 'app-visible' : 'app-hidden'}>
          <VinylAngel />
        </div>

        <div className={activeApp === 'arc-jurassic' ? 'app-visible' : 'app-hidden'}>
          <ArcJurassic />
        </div>
      </div>
    </div>
  )
}
