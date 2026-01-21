import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { addToQueue, cachePhoto } from '@/lib/offline-db'

export default function DriverActivePage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  
  const [order, setOrder] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadOrder()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  const loadOrder = async () => {
    try {
      // Charger driver
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('profile_id', user!.id)
        .single()
      
      setDriver(driverData)

      // Charger order
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, customer:profiles!customer_id(*)')
        .eq('id', orderId)
        .eq('driver_id', driverData.id)
        .single()

      setOrder(orderData)
    } catch (error) {
      console.error('Error loading order:', error)
      alert('Erreur de chargement')
      navigate('/driver/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      if (navigator.onLine) {
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
            throw new Error('Action inconnue')
        }

        const { data, error } = await supabase.rpc(rpcFunction as any, {
          order_id: orderId,
        })

        if (error) throw error
        if (!data?.success) throw new Error(data?.message)

        await loadOrder()
      } else {
        // Mode offline: ajouter à la queue
        await addToQueue('mark_status', {
          order_id: orderId,
          action,
        })
        alert('Action enregistrée (sera synchronisée en ligne)')
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCollectCash = async (stage: 'pickup' | 'delivery') => {
    const amount = prompt(`Montant collecté (FCFA) - ${stage}:`)
    if (!amount) return

    setActionLoading(true)
    try {
      const amountNum = parseFloat(amount)
      
      if (navigator.onLine) {
        const { data, error } = await supabase.rpc('driver_collect_cash', {
          order_id: orderId,
          stage,
          amount: amountNum,
        })

        if (error) throw error
        if (!data?.success) throw new Error(data?.message)

        await loadOrder()
      } else {
        await addToQueue('collect_cash', {
          order_id: orderId,
          stage,
          amount: amountNum,
        })
        alert('Collecte enregistrée (sera synchronisée en ligne)')
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadPOD = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' as any

    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return

      setActionLoading(true)
      try {
        if (navigator.onLine) {
          // Upload direct
          const fileName = `${orderId}/delivery_${Date.now()}.jpg`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('order-photos')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data, error } = await supabase.rpc('driver_add_pod_photo', {
            order_id: orderId,
            bucket: 'order-photos',
            path: fileName,
          })

          if (error) throw error
          if (!data?.success) throw new Error(data?.message)

          await loadOrder()
          alert('Photo POD ajoutée ✅')
        } else {
          // Mode offline: cacher pour upload ultérieur
          const photoId = await cachePhoto(orderId!, file, {
            type: 'delivery',
            timestamp: Date.now(),
          })
          
          await addToQueue('upload_photo', {
            order_id: orderId,
            photo_id: photoId,
          })
          
          alert('Photo enregistrée (sera uploadée en ligne)')
        }
      } catch (error: any) {
        alert('Erreur: ' + error.message)
      } finally {
        setActionLoading(false)
      }
    }

    input.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Commande introuvable</p>
      </div>
    )
  }

  const pickup = order.pickup_location
  const dropoff = order.dropoff_location

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4">
        <button onClick={() => navigate('/driver/dashboard')} className="mb-2">
          ← Retour
        </button>
        <h1 className="text-xl font-bold">Commande active</h1>
        <p className="text-blue-100 text-sm">#{order.id.substring(0, 8)}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Status */}
        <div className="card">
          <h2 className="font-semibold mb-3">Statut actuel</h2>
          <div className="badge badge-info text-base px-4 py-2 capitalize">
            {order.status.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Pickup */}
        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            📍 Point de collecte
          </h2>
          <p className="text-sm text-gray-600">{pickup.address}</p>
          <p className="text-sm font-medium mt-1">{pickup.contact_name}</p>
          <a href={`tel:${pickup.contact_phone}`} className="text-sm text-blue-600">
            {pickup.contact_phone}
          </a>
        </div>

        {/* Dropoff */}
        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            🎯 Point de livraison
          </h2>
          <p className="text-sm text-gray-600">{dropoff.address}</p>
          <p className="text-sm font-medium mt-1">{dropoff.contact_name}</p>
          <a href={`tel:${dropoff.contact_phone}`} className="text-sm text-blue-600">
            {dropoff.contact_phone}
          </a>
        </div>

        {/* Cargo */}
        <div className="card">
          <h2 className="font-semibold mb-3">Colis</h2>
          <p className="text-sm">{order.cargo.description}</p>
          <p className="text-sm text-gray-600 mt-1">
            Poids: {order.cargo.weight} kg
            {order.cargo.fragile && ' • Fragile ⚠️'}
          </p>
        </div>

        {/* Cash */}
        <div className="card">
          <h2 className="font-semibold mb-3">Paiement cash</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>À la collecte:</span>
              <span className="font-medium">{order.cash_at_pickup} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>À la livraison:</span>
              <span className="font-medium">{order.cash_at_delivery} FCFA</span>
            </div>
            <div className="flex justify-between text-blue-600 font-semibold">
              <span>Total:</span>
              <span>{order.cash_at_pickup + order.cash_at_delivery} FCFA</span>
            </div>
          </div>
          
          {order.status === 'picked_up' && order.cash_at_pickup > 0 && (
            <button
              onClick={() => handleCollectCash('pickup')}
              className="w-full mt-3 btn btn-secondary"
              disabled={actionLoading}
            >
              Collecter cash pickup
            </button>
          )}
          
          {order.status === 'in_transit' && order.cash_at_delivery > 0 && (
            <button
              onClick={() => handleCollectCash('delivery')}
              className="w-full mt-3 btn btn-secondary"
              disabled={actionLoading}
            >
              Collecter cash delivery
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="card space-y-3">
          <h2 className="font-semibold">Actions</h2>
          
          {order.status === 'driver_assigned' && (
            <button
              onClick={() => handleAction('arriving_pickup')}
              className="w-full btn btn-primary"
              disabled={actionLoading}
            >
              En route vers pickup
            </button>
          )}
          
          {order.status === 'arriving_pickup' && (
            <button
              onClick={() => handleAction('picked_up')}
              className="w-full btn btn-primary"
              disabled={actionLoading}
            >
              Colis récupéré
            </button>
          )}
          
          {order.status === 'picked_up' && (
            <button
              onClick={() => handleAction('in_transit')}
              className="w-full btn btn-primary"
              disabled={actionLoading}
            >
              En transit
            </button>
          )}
          
          {order.status === 'in_transit' && (
            <>
              <button
                onClick={handleUploadPOD}
                className="w-full btn btn-secondary"
                disabled={actionLoading}
              >
                📸 Ajouter photo POD
              </button>
              
              <button
                onClick={() => handleAction('delivered')}
                className="w-full btn btn-primary"
                disabled={actionLoading}
              >
                Marquer livré
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
