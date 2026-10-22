// Imperial Header Component - Gate of Babylon Style with Fail-Loudly Status Banner & Live Cyber-HUD
import { Crown, RefreshCw, Radio, AlertTriangle, Clock, Flame } from 'lucide-react'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { useGlobalStore, APP_REGISTRY } from '../store/useGlobalStore'
import { useCurrencyStore } from '../store/useCurrencyStore'
import { calculateHazardFromTime } from '../apps/golden-hour/store/useGoldenHourStore'
import { getRankFromScore, hasTier } from '../utils/rank'
import { formatDuration } from '../utils/time'
import { HazardBadge } from './HazardBadge'

export function ImperialHeader() {
  const { isOnline, lastError, isChecking, checkStatus } = useBackendStatus()
  const activeApp = useGlobalStore((s) => s.activeApp)
  const setActiveApp = useGlobalStore((s) => s.setActiveApp)
  const loadFromBackend = useGlobalStore((s) => s.loadFromBackend)
  const timeBalance = useCurrencyStore((s) => s.timeBalance)

  const { hazardLevel } = calculateHazardFromTime(timeBalance)
  const currentRank = getRankFromScore(hazardLevel)
  const currentApp = APP_REGISTRY.find((app) => app.id === activeApp)

  const handleRetry = async () => {
    await checkStatus()
    await loadFromBackend()
  }

  return (
    <header className="relative border-b border-[#2d2438] bg-[#0a080e]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Critical Offline Banner - Fail-Loudly Anti-Silent Mode */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-red-950/90 via-red-900/90 to-red-950/90 border-b border-red-600/60 px-6 py-2.5 text-red-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            <div>
              <span className="font-cinzel font-bold text-white tracking-wider uppercase mr-2">
                [Backend Storage Engine Offline]
              </span>
              <span className="text-red-300 font-mono">
                {lastError || 'Cannot connect to storage engine at http://localhost:8080. Durable game data will not synchronize.'}
              </span>
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-cinzel font-bold text-xs border border-red-500 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Reconnect</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37]/30 to-[#841822]/30 border border-[#d4af37] shadow-gold-sm">
            <Crown className="w-6 h-6 text-[#ffd86b] animate-pulse-slow" />
            <div className="absolute inset-0 rounded-xl border border-[#ffd86b]/40 animate-ping opacity-20 pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel-dec font-bold text-lg md:text-xl tracking-[3px] gold-text-gradient uppercase">
                Universe 25
              </h1>
              <span className="text-[10px] font-cinzel font-bold px-2 py-0.5 rounded bg-[#1e1726] border border-[#524124] text-[#ffd86b]">
                宇宙25
              </span>
            </div>
            <p className="text-xs text-[#9c93a8] font-cinzel tracking-wider">
              Autonomous Web Operating System • Blue Rose Engine
            </p>
          </div>
        </div>

        {/* TOP RIGHT: PROMINENT HAZARD & TIME CYBER-HUD WIDGET */}
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-end">
          {/* Main IDE Telemetry Panel */}
          <div className="ide-hud-widget px-5 py-2.5 flex items-center gap-4 sm:gap-6 shadow-2xl relative">
            <div className="ide-scanline" />

            {/* TIME SECTION (Live Count in Seconds via Format Duration) */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd86b]/20 to-[#f97316]/20 border border-[#ffd86b]/50 shadow-gold-sm flex-shrink-0">
                <Clock className="w-5 h-5 text-[#ffd86b] ide-chrono-icon" />
                <div className="ide-chrono-ring absolute -inset-1 rounded-xl border border-dashed border-[#ffd86b]/30 pointer-events-none" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-cinzel font-bold text-[#8c7a9e] tracking-wider uppercase">
                    TIME
                  </span>
                </div>
                <div className="font-mono text-lg md:text-xl font-black text-white tracking-tight leading-none mt-0.5">
                  {formatDuration(timeBalance)}
                </div>
              </div>
            </div>

            {/* Vertical Cyber Divider */}
            <div className="h-9 w-px bg-gradient-to-b from-transparent via-[#ffd86b]/40 to-transparent relative z-10 hidden sm:block" />

            {/* HAZARD SECTION (Formula: hazard = ln(time/3600)) */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#841822]/40 to-[#291e07]/40 border border-[#ef4444]/60 shadow-md flex-shrink-0">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <div className="absolute inset-0 rounded-xl bg-amber-500/10 blur-sm animate-ping opacity-20 pointer-events-none" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-cinzel font-bold text-[#8c7a9e] tracking-wider uppercase">
                    HAZARD
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-lg md:text-xl font-black text-[#ffd86b] tracking-tight leading-none ide-hazard-glow">
                    {hazardLevel.toFixed(2)}
                  </span>
                  {hasTier(currentRank) && (
                    <HazardBadge score={hazardLevel} rank={currentRank} size="sm" showDetails={false} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Engine Status & Sync Button */}
          <div className="flex items-center gap-2">
            {/* Backend Status Indicator */}
            <div
              title={isOnline ? 'Storage Engine Online' : (lastError || 'Disconnected')}
              className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs ${
                isOnline
                  ? 'bg-[#14101c] border-[#33283f] text-emerald-400'
                  : 'bg-red-950/40 border-red-600/50 text-red-400'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-red-500 animate-ping'}`} />
              <span className="font-mono text-[11px] font-bold hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Reconnect / Sync Button */}
            <button
              onClick={handleRetry}
              disabled={isChecking}
              title="Sync with Storage Engine"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1424] hover:bg-[#261d36] border border-[#524124] text-[#ffd86b] text-xs font-semibold shadow-gold-sm transition duration-75 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="font-cinzel text-xs hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* App Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 pb-3">
        <div className="flex items-center justify-between gap-4 border-b border-[#231b2e] pb-3">
          <nav className="flex flex-wrap gap-2.5">
            {APP_REGISTRY.map((app) => {
              const isActive = app.id === activeApp
              return (
                <button
                  key={app.id}
                  onClick={() => setActiveApp(app.id)}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-cinzel text-xs md:text-sm font-bold tracking-wider transition duration-75 cursor-pointer active:scale-[0.98] select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black shadow-gold-md'
                      : 'bg-[#120f18] text-[#9c93a8] hover:text-white border border-[#2b2238] hover:border-[#524124]'
                  }`}
                >
                  <span className="text-lg">{app.icon}</span>
                  <span>{app.name}</span>
                </button>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 text-xs font-mono text-[#9c93a8]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Active: <strong className="text-white">{currentApp?.name || 'Golden Hour'}</strong></span>
          </div>
        </div>
      </div>
    </header>
  )
}
