// path: src/themes/ThemeProvider.tsx

import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from '../store/useThemeStore'
import { ThemeEffects } from './ThemeEffects'

/**
 * Applies CSS custom properties to document.documentElement (:root)
 * whenever activeThemeId changes in the store. Zero re-render cost for children.
 * Also renders theme-specific particle effects and animations.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const activeTheme = useThemeStore((s) => s.getActiveTheme())

  useEffect(() => {
    const root = document.documentElement
    const tokens = activeTheme.tokens

    Object.entries(tokens).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })

    // Update body background for smoother theme transitions
    document.body.style.transition = 'background 0.5s ease-in-out'
  }, [activeTheme])

  return (
    <>
      <ThemeEffects />
      <div className="relative z-10">{children}</div>
    </>
  )
}
