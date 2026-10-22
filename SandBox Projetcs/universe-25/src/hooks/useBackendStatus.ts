// path: src/hooks/useBackendStatus.ts

import { useState, useEffect, useCallback } from 'react'
import { subscribeBackendStatus, checkBackendHealth, getBackendStatus } from '../core/api'

export function useBackendStatus() {
  const initialStatus = getBackendStatus()
  const [isOnline, setIsOnline] = useState<boolean>(initialStatus.isOnline)
  const [lastError, setLastError] = useState<string | null>(initialStatus.lastError)
  const [isChecking, setIsChecking] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((status) => {
      setIsOnline(status.isOnline)
      setLastError(status.lastError)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const checkStatus = useCallback(async () => {
    setIsChecking(true)
    try {
      await checkBackendHealth()
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 15000) // Poll health every 15s
    return () => clearInterval(interval)
  }, [checkStatus])

  return { isOnline, lastError, isChecking, checkStatus }
}
