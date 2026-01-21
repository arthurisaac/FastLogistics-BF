export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export const APP_CONFIG = {
  name: 'FastLogistics BF',
  version: '1.0.0',
  supportPhone: '+226 XX XX XX XX',
  supportEmail: 'support@fastlogistics.bf',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  NO_DRIVER_FOUND: 'no_driver_found',
  DRIVER_ASSIGNED: 'driver_assigned',
  ARRIVING_PICKUP: 'arriving_pickup',
  ARRIVED_PICKUP: 'arrived_pickup',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  ARRIVING_DELIVERY: 'arriving_delivery',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const SERVICE_TYPES = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  SCHEDULED: 'scheduled',
} as const

export const VEHICLE_TYPES = {
  MOTO: 'moto',
  CAR: 'car',
  VAN: 'van',
  TRUCK: 'truck',
} as const

export const PAYMENT_METHODS = {
  CASH: 'cash',
} as const

export const ROLES = {
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  ADMIN: 'admin',
} as const

export const DISPATCH_TTL_SECONDS = 120 // 2 minutes pour accepter une commande
export const MAX_DISPATCH_ROUNDS = 3
export const BATCH_SIZE_PER_ROUND = 5
