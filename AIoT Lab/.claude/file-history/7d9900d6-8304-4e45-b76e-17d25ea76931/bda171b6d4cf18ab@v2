// path: src/apps/heraclitus/types.ts

export interface VideoItem {
  id: string
  title: string
  duration: number | null
  duration_formatted: string
  url: string
}

export interface SpeedBreakdown {
  speed: number
  duration_seconds: number
  formatted: string
  time_saved_formatted: string
}

export interface PlaylistDurationResult {
  title: string
  uploader: string
  total_videos: number
  active_videos: number
  unavailable_videos: number
  total_seconds: number
  formatted_duration: string
  average_duration_seconds: number
  average_duration_formatted: string
  speed_breakdowns: SpeedBreakdown[]
  videos: VideoItem[]
}

export interface PoolTransaction {
  id: string
  timestamp: string
  source: string
  category: string
  seconds: number
  formatted: string
  speed: number
  notes?: string
}

export interface YellowTimePoolState {
  balance_seconds: number
  total_earned_seconds: number
  formatted_balance: string
  formatted_total_earned: string
  transactions: PoolTransaction[]
}

export interface PoolDepositRequest {
  seconds: number
  source: string
  category: string
  speed: number
  notes?: string
}
