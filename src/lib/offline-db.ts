import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineQueueItem {
  id: string
  type: 'collect_cash' | 'mark_status' | 'upload_photo'
  payload: any
  timestamp: number
  retryCount: number
  status: 'pending' | 'processing' | 'failed'
  error?: string
}

interface FastLogisticsDB extends DBSchema {
  queue: {
    key: string
    value: OfflineQueueItem
    indexes: { 'by-status': string; 'by-timestamp': number }
  }
  orders: {
    key: string
    value: any
  }
  photos: {
    key: string
    value: { id: string; orderId: string; blob: Blob; metadata: any }
  }
}

let dbInstance: IDBPDatabase<FastLogisticsDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FastLogisticsDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FastLogisticsDB>('fastlogistics-bf', 1, {
    upgrade(db) {
      // Queue store
      if (!db.objectStoreNames.contains('queue')) {
        const queueStore = db.createObjectStore('queue', { keyPath: 'id' })
        queueStore.createIndex('by-status', 'status')
        queueStore.createIndex('by-timestamp', 'timestamp')
      }

      // Orders cache
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' })
      }

      // Photos cache (blobs)
      if (!db.objectStoreNames.contains('photos')) {
        const photosStore = db.createObjectStore('photos', { keyPath: 'id' })
        photosStore.createIndex('by-order', 'orderId')
      }
    },
  })

  return dbInstance
}

// Queue operations
export async function addToQueue(
  type: OfflineQueueItem['type'],
  payload: any
): Promise<string> {
  const db = await getDB()
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const item: OfflineQueueItem = {
    id,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  }

  await db.add('queue', item)
  console.log('✅ Item added to offline queue:', id)
  
  return id
}

export async function getQueueItems(
  status?: OfflineQueueItem['status']
): Promise<OfflineQueueItem[]> {
  const db = await getDB()
  
  if (status) {
    return db.getAllFromIndex('queue', 'by-status', status)
  }
  
  return db.getAll('queue')
}

export async function updateQueueItem(
  id: string,
  updates: Partial<OfflineQueueItem>
): Promise<void> {
  const db = await getDB()
  const item = await db.get('queue', id)
  
  if (item) {
    await db.put('queue', { ...item, ...updates })
  }
}

export async function deleteQueueItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('queue', id)
}

export async function clearQueue(): Promise<void> {
  const db = await getDB()
  await db.clear('queue')
}

// Orders cache
export async function cacheOrder(order: any): Promise<void> {
  const db = await getDB()
  await db.put('orders', order)
}

export async function getCachedOrder(orderId: string): Promise<any> {
  const db = await getDB()
  return db.get('orders', orderId)
}

export async function getAllCachedOrders(): Promise<any[]> {
  const db = await getDB()
  return db.getAll('orders')
}

// Photos cache (pour upload différé)
export async function cachePhoto(
  orderId: string,
  blob: Blob,
  metadata: any
): Promise<string> {
  const db = await getDB()
  const id = `photo_${orderId}_${Date.now()}`
  
  await db.add('photos', {
    id,
    orderId,
    blob,
    metadata,
  })
  
  return id
}

export async function getCachedPhotos(orderId: string): Promise<any[]> {
  const db = await getDB()
  const allPhotos = await db.getAll('photos')
  return allPhotos.filter(p => p.orderId === orderId)
}

export async function deleteCachedPhoto(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('photos', id)
}

// Stats
export async function getQueueStats() {
  const items = await getQueueItems()
  
  return {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    processing: items.filter(i => i.status === 'processing').length,
    failed: items.filter(i => i.status === 'failed').length,
  }
}
