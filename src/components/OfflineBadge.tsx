import React from 'react'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'

export function OfflineBadge() {
  const { isOnline, stats, isSyncing, triggerSync } = useOfflineQueue()

  if (isOnline && stats.total === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm border-l-4 border-blue-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            )}
            <span className="font-semibold text-sm">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
          {isOnline && stats.pending > 0 && !isSyncing && (
            <button
              onClick={triggerSync}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Synchroniser
            </button>
          )}
        </div>

        {stats.total > 0 && (
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              {isSyncing ? (
                <span className="text-blue-600">Synchronisation en cours...</span>
              ) : (
                <>
                  {stats.pending} action(s) en attente
                  {stats.failed > 0 && (
                    <span className="text-red-600 ml-2">
                      ({stats.failed} échec(s))
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
