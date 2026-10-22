// path: src/core/types.ts

/** Manifest entry for each app registered in Universe 25 */
export interface AppManifest {
  id: string
  name: string
  icon: string
  description: string
}

/** Shape of the POST body to Blue Rose Storage Engine */
export interface ApiRequest {
  project_id: string
  tier: string
  order: {
    action: string
    key?: string
    data?: unknown
  }
}

/** Generic API response envelope */
export interface ApiResponse<T = unknown> {
  data?: T
  status?: string
  message?: string
}

/** A single crop plot in a farming game */
export interface Plot {
  cropType: string | null
  growthStage: number // 0=empty, 1=seed, 2=sprout, 3=mature, 4=harvestable
  plantedAt: number | null
}

/** Theme token map — all CSS custom properties a theme must define */
export interface ThemeTokens {
  '--bg-primary': string
  '--bg-secondary': string
  '--bg-card': string
  '--text-primary': string
  '--text-secondary': string
  '--accent': string
  '--accent-hover': string
  '--border': string
  '--radius': string
  '--success': string
  '--warning': string
  '--danger': string
  [key: string]: string // allow extension
}

/** A theme definition */
export interface ThemeConfig {
  id: string
  name: string
  icon: string
  tokens: ThemeTokens
  unlocked: boolean // whether player has earned this theme
}
