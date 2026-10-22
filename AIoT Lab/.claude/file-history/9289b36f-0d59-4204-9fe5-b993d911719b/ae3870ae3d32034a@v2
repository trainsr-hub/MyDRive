// path: src/apps/heraclitus/services/heraclitusApi.ts

import { API_BASE } from '../../../core/api'
import type { PlaylistDurationResult, YellowTimePoolState, PoolDepositRequest } from '../types'

export async function fetchPlaylistDuration(url: string): Promise<PlaylistDurationResult> {
  const cleanUrl = url.trim()
  if (!cleanUrl) {
    throw new Error('Playlist URL is required')
  }

  const endpoint = `${API_BASE}/api/v1/heraclitus/playlist-duration`

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: cleanUrl }),
    })
  } catch {
    throw new Error(
      `Cannot connect to Heraclitus Backend Engine at ${API_BASE}. Ensure Universe25.bat backend service is active.`
    )
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message = errorBody?.detail || `Calculation request failed with status ${response.status}`
    throw new Error(message)
  }

  return response.json()
}

export async function fetchPoolState(): Promise<YellowTimePoolState> {
  const endpoint = `${API_BASE}/api/v1/heraclitus/yellow-time-pool`

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error(
      `Cannot connect to Heraclitus Backend Engine at ${API_BASE}. Ensure Universe25.bat backend service is active.`
    )
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message = errorBody?.detail || `Failed to fetch pool state with status ${response.status}`
    throw new Error(message)
  }

  return response.json()
}

export async function depositToPool(payload: PoolDepositRequest): Promise<YellowTimePoolState> {
  const endpoint = `${API_BASE}/api/v1/heraclitus/yellow-time-pool/deposit`

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(
      `Cannot connect to Heraclitus Backend Engine at ${API_BASE}. Ensure Universe25.bat backend service is active.`
    )
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message = errorBody?.detail || `Deposit failed with status ${response.status}`
    throw new Error(message)
  }

  return response.json()
}
