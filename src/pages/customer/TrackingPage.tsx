import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export default function TrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  
  const [order, setOrder] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
    loadEvents()
    loadPhotos()
    
    // Subscribe to realtime updates
    const orderChannel = supabase
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

    const eventsChannel = supabase
      .channel(`events:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_events',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          loadEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [orderId])

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, driver:drivers!driver_id(*, profile:profiles!profile_id(*))')
        .eq('id', orderId)
        .eq('customer_id', user!.id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    const { data } = await supabase
      .from('order_events')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    setEvents(data || [])
  }

  const loadPhotos = async () => {
    const { data } = await supabase
      .from('order_photos')
      .select('*')
      .eq('order_id', orderId)
      .eq('photo_type', 'delivery') // POD only

    if (data && data.length > 0) {
      // Get public URLs for photos
      const photosWithUrls = await Promise.all(
        data.map(async (photo) => {
          const { data: urlData } = supabase.storage
            .from(photo.storage_bucket)
            .getPublicUrl(photo.storage_path)
          
          return { ...photo, url: urlData.publicUrl }
        })
      )
      setPhotos(photosWithUrls)
    }
  }

  const handleConfirmCompleted = async () => {
    if (!confirm('Confirmer que la commande est complétée ?')) return

    try {
      const { data, error } = await supabase.rpc('customer_confirm_completed', {
        order_id: orderId,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message)

      await loadOrder()
      alert('Commande marquée comme complétée ✅')
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    }
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
        <button onClick={() => navigate('/dashboard')} className="mb-2">
          ← Retour
        </button>
        <h1 className="text-xl font-bold">Suivi de commande</h1>
        <p className="text-blue-100 text-sm">#{order.id.substring(0, 8)}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Status */}
        <div className="card">
          <h2 className="font-semibold mb-3">Statut</h2>
          <div className="badge badge-info text-base px-4 py-2 capitalize">
            {order.status.replace(/_/g, ' ')}
          </div>
          
          {order.status === 'delivered' && (
            <button
              onClick={handleConfirmCompleted}
              className="w-full mt-4 btn btn-primary"
            >
              Confirmer réception
            </button>
          )}
        </div>

        {/* Driver info */}
        {order.driver && (
          <div className="card">
            <h2 className="font-semibold mb-3">Chauffeur</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <div className="font-medium">{order.driver.profile.full_name}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {order.driver.vehicle_type} • {order.driver.vehicle_plate}
                </div>
                <div className="text-sm text-gray-600">
                  ⭐ {order.driver.rating.toFixed(1)} ({order.driver.total_deliveries} livraisons)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Itinerary */}
        <div className="card">
          <h2 className="font-semibold mb-4">Itinéraire</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  A
                </div>
                <div>
                  <div className="font-medium">Collecte</div>
                  <div className="text-sm text-gray-600">{pickup.address}</div>
                  <div className="text-sm text-gray-600">{pickup.contact_name} • {pickup.contact_phone}</div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 border-l-2 border-dashed border-gray-300 h-8"></div>
            
            <div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  B
                </div>
                <div>
                  <div className="font-medium">Livraison</div>
                  <div className="text-sm text-gray-600">{dropoff.address}</div>
                  <div className="text-sm text-gray-600">{dropoff.contact_name} • {dropoff.contact_phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POD Photos */}
        {photos.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3">Photos de livraison (POD)</h2>
            <div className="grid grid-cols-2 gap-2">
              {photos.map(photo => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="POD"
                  className="w-full h-32 object-cover rounded-lg"
                  onClick={() => window.open(photo.url, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="card">
          <h2 className="font-semibold mb-4">Historique</h2>
          
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="font-medium">{event.description}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="font-semibold mb-3">Paiement</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Prix estimé:</span>
              <span className="font-medium">{order.estimated_price} FCFA</span>
            </div>
            {order.final_price && (
              <div className="flex justify-between font-semibold text-blue-600">
                <span>Prix final:</span>
                <span>{order.final_price} FCFA</span>
              </div>
            )}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Méthode:</span>
                <span className="capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Statut:</span>
                <span className="capitalize">{order.payment_status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
