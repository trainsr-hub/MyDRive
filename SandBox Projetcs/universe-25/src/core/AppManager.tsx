// path: src/core/AppManager.tsx

import { Routes, Route } from 'react-router-dom'
import { ImperialHeader } from '../components/ImperialHeader'
import { GoldenHour } from '../apps/golden-hour/GoldenHour'
import { VinylAngel } from '../apps/vinyl-angel/VinylAngel'
import { ArcJurassic } from '../apps/arc-jurassic/ArcJurassic'
import { DinoPomodoro } from '../apps/dino-pomodoro/DinoPomodoro'
import { Heraclitus } from '../apps/heraclitus/Heraclitus'

/**
 * AppManager renders exactly ONE app component per URL path.
 *
 * Each <Route> mounts its component only when the path matches
 * and fully unmounts it (with GC of its React tree, Web Audio
 * contexts, event listeners, and timers) when navigating away.
 *
 * This gives every app a truly independent RAM footprint:
 * VinylAngel's audio engine is stone-dead outside /vinyl-angel.
 *
 * Zustand stores are module-level singletons and intentionally
 * survive unmounts — they hold durable game state, not heap bloat.
 */
export function AppManager() {

  return (
    <div className="w-full min-h-screen portal-backdrop text-[#f5f0e8] font-inter selection:bg-[#d4af37] selection:text-black">
      <ImperialHeader />

      <div className="w-full">
        <Routes>
          <Route path="/golden-hour/*"   element={<GoldenHour />} />
          <Route path="/vinyl-angel/*"   element={<VinylAngel />} />
          <Route path="/arc-jurassic/*"  element={<ArcJurassic />} />
          <Route path="/dino-pomodoro/*" element={<DinoPomodoro />} />
          <Route path="/heraclitus/*"    element={<Heraclitus />} />
        </Routes>
      </div>
    </div>
  )
}

