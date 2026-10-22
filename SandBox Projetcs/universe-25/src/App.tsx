// path: src/App.tsx

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { ThemeProvider } from './themes/ThemeProvider'
import { AppManager } from './core/AppManager'
import { useGlobalStore } from './store/useGlobalStore'
import { APP_REGISTRY } from './store/useGlobalStore'

export default function App() {
  const loadFromBackend = useGlobalStore((s) => s.loadFromBackend)
  const setActiveApp    = useGlobalStore((s) => s.setActiveApp)
  const isOnline        = useGlobalStore((s) => s.isOnline)
  const location        = useLocation()

  const wasOnlineRef = useRef<boolean>(true)

  // ── 1. Drive activeApp from the current URL path ───────────────────────────
  // e.g. /heraclitus → activeApp = 'heraclitus'
  useEffect(() => {
    const matched = APP_REGISTRY.find((app) => location.pathname.startsWith(app.path))
    if (matched) {
      setActiveApp(matched.id)
    }
  }, [location.pathname, setActiveApp])

  // ── 2. Initial hydration on cold mount ────────────────────────────────────
  useEffect(() => {
    loadFromBackend()
  }, [loadFromBackend])

  // ── 3. Periodic background re-hydration every 60 seconds ─────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      loadFromBackend()
    }, 60_000)
    return () => clearInterval(timer)
  }, [loadFromBackend])

  // ── 4. Tab-focus re-hydration via Page Visibility API ─────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadFromBackend()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadFromBackend])

  // ── 5. Online-recovery re-hydration ───────────────────────────────────────
  useEffect(() => {
    const wasOffline = !wasOnlineRef.current
    if (wasOffline && isOnline) {
      loadFromBackend()
    }
    wasOnlineRef.current = isOnline
  }, [isOnline, loadFromBackend])

  return (
    <ThemeProvider>
      <AppManager />
    </ThemeProvider>
  )
}
