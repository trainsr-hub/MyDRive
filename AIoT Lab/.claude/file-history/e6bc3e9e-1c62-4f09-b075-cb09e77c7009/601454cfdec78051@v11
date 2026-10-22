// path: src/apps/heraclitus/components/YellowPoolTab.tsx
// Tier 4 Presentation Component: 100% Submersed Full-Bleed Kinetic Gacha Stage matching Arc Jurassic

import React, { useEffect, useRef, useCallback } from 'react'
import { fetchPoolState, depositToPool } from '../services/heraclitusApi'

export const YellowPoolTab: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const balanceSecRef = useRef<number>(0)

  // Load authoritative balance from SQLite on mount
  const loadPoolState = useCallback(async () => {
    try {
      const state = await fetchPoolState()
      balanceSecRef.current = state.balance_seconds

      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SET_BALANCE', seconds: state.balance_seconds },
          '*'
        )
      }
    } catch {
      // Offline fallback
    }
  }, [])

  useEffect(() => {
    loadPoolState()
  }, [loadPoolState])

  // PostMessage listener: syncs balance to iframe, and commits deposits to SQLite
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return

      if (event.data.type === 'IFRAME_READY') {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'SET_BALANCE', seconds: balanceSecRef.current },
            '*'
          )
        }
      } else if (event.data.type === 'DEPOSIT_COMMITTED') {
        const seconds = Number(event.data.seconds) || 0
        balanceSecRef.current += seconds

        try {
          const updatedState = await depositToPool({
            seconds,
            source: 'Chrono Gacha Roll',
            category: 'gacha',
            speed: 1.0,
            notes: 'Submersed Kinetic Gacha Channel',
          })
          balanceSecRef.current = updatedState.balance_seconds
        } catch {
          // Graceful fallback
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_BALANCE', seconds: balanceSecRef.current },
        '*'
      )
    }
  }

  return (
    <div className="w-full h-[calc(100vh-210px)] min-h-[640px] flex items-center justify-center relative overflow-hidden bg-transparent border-0 shadow-none">
      <iframe
        ref={iframeRef}
        src="/animations/2-phases/phase_005_spool_and_shatter.html"
        title="Chrono Accumulator Stage"
        onLoad={handleIframeLoad}
        className="w-full h-full border-0 outline-none bg-transparent block overflow-hidden"
      />
    </div>
  )
}

export default YellowPoolTab
