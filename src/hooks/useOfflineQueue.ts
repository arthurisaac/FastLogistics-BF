import { useState, useEffect } from 'react'
import { getQueueStats } from '@/lib/offline-db'
import { syncQueue } from '@/lib/sync'

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    failed: 0,
  })
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshStats = async () => {
    const newStats = await getQueueStats()
    setStats(newStats)
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial load
    refreshStats()

    // Refresh stats every 5 seconds
    const interval = setInterval(refreshStats, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const triggerSync = async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline')
    }

    setIsSyncing(true)
    try {
      const result = await syncQueue()
      await refreshStats()
      return result
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    isOnline,
    stats,
    isSyncing,
    triggerSync,
    refreshStats,
  }
}
