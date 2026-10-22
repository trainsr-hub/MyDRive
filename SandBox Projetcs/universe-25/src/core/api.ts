// path: src/core/api.ts

import type { ApiRequest, ApiResponse } from './types'

// NOTE: use the IPv4 literal, NOT 'localhost'. On Windows 'localhost' resolves to ::1 first; the backend only
// listens on IPv4, so every new connection stalls ~2s on the refused IPv6 attempt before falling back.
export const API_BASE = 'http://127.0.0.1:8080'
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
    const timeoutId = setTimeout(() => controller.abort(), 8000)

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
async function executeRaw<T = unknown>(
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

// =============================================================================
// [REQUEST ACTIVITY TRACKER] - lets UIs explain *what* they are waiting for
// =============================================================================
export interface ApiActivityEntry {
  label: string
  startedAt: number
}

export interface ApiActivity {
  inFlight: ApiActivityEntry[]
  lastLabel: string | null
  lastMs: number | null
}

let activitySeq = 0
const activeRequests = new Map<number, ApiActivityEntry>()
let activitySnapshot: ApiActivity = { inFlight: [], lastLabel: null, lastMs: null }
const activityListeners = new Set<(a: ApiActivity) => void>()

function publishActivity(lastLabel?: string, lastMs?: number) {
  activitySnapshot = {
    inFlight: Array.from(activeRequests.values()),
    lastLabel: lastLabel ?? activitySnapshot.lastLabel,
    lastMs: lastMs ?? activitySnapshot.lastMs,
  }
  activityListeners.forEach((l) => l(activitySnapshot))
}

export function getApiActivity(): ApiActivity {
  return activitySnapshot
}

export function subscribeApiActivity(listener: (a: ApiActivity) => void): () => void {
  activityListeners.add(listener)
  return () => {
    activityListeners.delete(listener)
  }
}

/**
 * Single reusable function for all backend communication (tracked wrapper around executeRaw).
 */
export async function execute<T = unknown>(
  tier: string,
  action: string,
  key?: string,
  data?: unknown,
  projectId: string = DEFAULT_PROJECT_ID
): Promise<ApiResponse<T>> {
  const id = ++activitySeq
  const label = `T${tier}:${action}`
  const startedAt = performance.now()
  activeRequests.set(id, { label, startedAt })
  publishActivity()
  try {
    return await executeRaw<T>(tier, action, key, data, projectId)
  } finally {
    activeRequests.delete(id)
    publishActivity(label, Math.round(performance.now() - startedAt))
  }
}
