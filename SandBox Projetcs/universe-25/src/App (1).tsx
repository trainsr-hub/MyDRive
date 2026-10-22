// path: src/App.tsx

import { useEffect } from 'react'
import { ThemeProvider } from './themes/ThemeProvider'
import { AppManager } from './core/AppManager'
import { useGlobalStore } from './store/useGlobalStore'

export default function App() {
  const loadFromBackend = useGlobalStore((s) => s.loadFromBackend)

  // Load state from backend on mount
  useEffect(() => {
    loadFromBackend()
  }, [loadFromBackend])

  return (
    <ThemeProvider>
      <AppManager />
    </ThemeProvider>
  )
}
