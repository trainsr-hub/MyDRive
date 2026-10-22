// path: src/core/api.ts

import type { ApiRequest, ApiResponse } from './types'

export const API_BASE = 'http://localhost:8080'
export const DEFAULT_PROJECT_ID = 'universe_25'

export interface BackendStatus {
  isOnline: boolean
  lastCheckedAt: string | null
  lastError: string | null
}

let currentStatus: BackendStatus = {
  isOnline: true,
  lastCheckedAt: null,
  lastError: null,
}

type StatusListener = (status: BackendStatus) => void
const statusListeners = new Set<StatusListener>()

export function getBackendStatus(): BackendStatus {
  return currentStatus
}

export function subscribeBackendStatus(listener: StatusListener): () => void {
  statusListeners.add(listener)
  listener(currentStatus)
  return () => {
    statusListeners.delete(listener)
  }
}

function updateStatus(isOnline: boolean, error: string | null = null) {
  currentStatus = {
    isOnline,
    lastCheckedAt: new Date().toISOString(),
    lastError: error,
  }
  statusListeners.forEach((listener) => listener(currentStatus))
}

/**
 * Health check to verify if the Blue Rose backend storage engine is running.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      updateStatus(true, null)
      return true
    } else {
      const errText = `Backend returned HTTP status ${res.status}`
      updateStatus(false, errText)
      return false
    }
  } catch (err) {
    const errText = err instanceof Error ? err.message : 'Backend connection failed'
    updateStatus(false, errText)
    return false
  }
}

/**
 * Single reusable function for all backend communication.
 * Every call goes through POST /api/v1/execute.
 * Never silently swallows errors!
 */
export async function execute<T = unknown>(
  tier: string,
  action: string,
  key?: string,
  data?: unknown,
  projectId: string = DEFAULT_PROJECT_ID
): Promise<ApiResponse<T>> {
  const body: ApiRequest = {
    project_id: projectId,
    tier,
    order: { action, ...(key && { key }), ...(data !== undefined && { data }) },
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      const errorMsg = err.detail || `API error HTTP ${res.status}`
      updateStatus(false, errorMsg)
      throw new Error(`[Backend Engine Error] ${errorMsg}`)
    }

    const json = await res.json()
    updateStatus(true, null)
    return json
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network failure contacting backend'
    updateStatus(false, errorMsg)
    throw new Error(`[Backend Unreachable] ${errorMsg}`)
  }
}
