import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { SERVICE_TYPES } from '@/config/constants'

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthContext()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      driver_assigned: 'badge-info',
      in_transit: 'badge-info',
      delivered: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-error',
      no_driver_found: 'badge-error',
    }
    return badges[status] || 'badge-info'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Mes commandes</h1>
          <button onClick={signOut} className="text-sm">
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate(`/book/${SERVICE_TYPES.STANDARD}`)}
            className="card hover:shadow-lg transition"
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="font-semibold">Standard</div>
            <div className="text-xs text-gray-600">Livraison jour même</div>
          </button>
          
          <button
            onClick={() => navigate(`/book/${SERVICE_TYPES.EXPRESS}`)}
            className="card hover:shadow-lg transition"
          >
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold">Express</div>
            <div className="text-xs text-gray-600">2-3 heures</div>
          </button>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Historique</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-600">Aucune commande</p>
              <button
                onClick={() => navigate(`/book/${SERVICE_TYPES.STANDARD}`)}
                className="mt-4 btn btn-primary"
              >
                Créer une commande
              </button>
            </div>
          ) : (
            orders.map(order => {
              const pickup = order.pickup_location
              const dropoff = order.dropoff_location
              
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/track/${order.id}`)}
                  className="card hover:shadow-lg transition w-full text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">
                        #{order.id.substring(0, 8)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <span>📍</span>
                      <span className="text-gray-600 truncate">{pickup.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span>🎯</span>
                      <span className="text-gray-600 truncate">{dropoff.address}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {order.vehicle_type}
                    </span>
                    <span className="font-semibold text-blue-600">
                      {order.estimated_price} FCFA
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
