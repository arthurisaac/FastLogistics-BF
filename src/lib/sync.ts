import { supabase } from '@/config/supabase'
import {
  addToQueue,
  getQueueItems,
  updateQueueItem,
  deleteQueueItem,
  getCachedPhotos,
  deleteCachedPhoto,
} from './offline-db'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export async function syncQueue(): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  const items = await getQueueItems('pending')
  let success = 0
  let failed = 0
  const errors: string[] = []

  console.log(`📡 Starting sync: ${items.length} items in queue`)

  for (const item of items) {
    try {
      await updateQueueItem(item.id, { status: 'processing' })

      switch (item.type) {
        case 'collect_cash':
          await syncCollectCash(item)
          break
        case 'mark_status':
          await syncMarkStatus(item)
          break
        case 'upload_photo':
          await syncUploadPhoto(item)
          break
        default:
          throw new Error(`Unknown queue item type: ${item.type}`)
      }

      await deleteQueueItem(item.id)
      success++
      console.log(`✅ Synced: ${item.id}`)
    } catch (error: any) {
      console.error(`❌ Failed to sync ${item.id}:`, error)

      const newRetryCount = item.retryCount + 1

      if (newRetryCount >= MAX_RETRIES) {
        await updateQueueItem(item.id, {
          status: 'failed',
          retryCount: newRetryCount,
          error: error.message,
        })
        failed++
        errors.push(`${item.id}: ${error.message}`)
      } else {
        await updateQueueItem(item.id, {
          status: 'pending',
          retryCount: newRetryCount,
          error: error.message,
        })
        // Delay next retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
  }

  console.log(`📊 Sync complete: ${success} success, ${failed} failed`)

  return { success, failed, errors }
}

async function syncCollectCash(item: any) {
  const { order_id, stage, amount } = item.payload

  const { data, error } = await supabase.rpc('driver_collect_cash', {
    order_id,
    stage,
    amount,
  })

  if (error) throw error
  if (!data?.success) throw new Error(data?.message || 'Failed to collect cash')
}

async function syncMarkStatus(item: any) {
  const { order_id, action } = item.payload

  let rpcFunction = ''

  switch (action) {
    case 'arriving_pickup':
      rpcFunction = 'driver_mark_arriving_pickup'
      break
    case 'picked_up':
      rpcFunction = 'driver_mark_picked_up'
      break
    case 'in_transit':
      rpcFunction = 'driver_mark_in_transit'
      break
    case 'delivered':
      rpcFunction = 'driver_mark_delivered'
      break
    default:
      throw new Error(`Unknown action: ${action}`)
  }

  const { data, error } = await supabase.rpc(rpcFunction as any, { order_id })

  if (error) throw error
  if (!data?.success) throw new Error(data?.message || 'Failed to update status')
}

async function syncUploadPhoto(item: any) {
  const { order_id, photo_id } = item.payload

  // Récupérer le blob depuis IndexedDB
  const cachedPhotos = await getCachedPhotos(order_id)
  const photo = cachedPhotos.find(p => p.id === photo_id)

  if (!photo) {
    throw new Error(`Photo ${photo_id} not found in cache`)
  }

  // Upload vers Supabase Storage
  const fileName = `${order_id}/delivery_${Date.now()}.jpg`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('order-photos')
    .upload(fileName, photo.blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) throw uploadError

  // Enregistrer via RPC
  const { data, error } = await supabase.rpc('driver_add_pod_photo', {
    order_id,
    bucket: 'order-photos',
    path: fileName,
    caption: photo.metadata?.caption || null,
    metadata: photo.metadata || null,
  })

  if (error) throw error
  if (!data?.success) throw new Error(data?.message || 'Failed to add POD photo')

  // Supprimer du cache
  await deleteCachedPhoto(photo_id)
}

// Auto-sync when online
let syncInterval: NodeJS.Timeout | null = null

export function startAutoSync(intervalMs = 30000) {
  if (syncInterval) return

  console.log(`🔄 Starting auto-sync every ${intervalMs}ms`)

  syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      try {
        await syncQueue()
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }
  }, intervalMs)
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('⏸️ Auto-sync stopped')
  }
}

// Trigger sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Back online, triggering sync...')
    syncQueue()
  })
}
