import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthContext()
  const [driver, setDriver] = useState<any>(null)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDriver()
  }, [])

  const loadDriver = async () => {
    try {
      const { data: driverData, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('profile_id', user!.id)
        .single()

      if (error) throw error
      setDriver(driverData)

      // Load active order if any
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driverData.id)
        .in('status', [
          'driver_assigned',
          'arriving_pickup',
          'arrived_pickup',
          'picked_up',
          'in_transit',
        ])
        .single()

      setActiveOrder(orderData)
    } catch (error) {
      console.error('Error loading driver:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOnlineStatus = async () => {
    if (!driver) return

    const newStatus = driver.online_status === 'online' ? 'offline' : 'online'

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ online_status: newStatus })
        .eq('id', driver.id)

      if (error) throw error

      setDriver({ ...driver, online_status: newStatus })
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

  if (!driver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Erreur de chargement du profil driver</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Dashboard Driver</h1>
          <button onClick={signOut} className="text-sm">
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Status card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{driver.profile?.full_name || 'Driver'}</h2>
              <p className="text-sm text-gray-600 capitalize">
                {driver.vehicle_type} • {driver.vehicle_plate}
              </p>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                driver.online_status === 'online'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {driver.online_status === 'online' ? '🟢 En ligne' : '⚫ Hors ligne'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{driver.total_deliveries}</div>
              <div className="text-xs text-gray-600">Livraisons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {driver.rating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Note</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {driver.online_status === 'busy' ? '1' : '0'}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
          </div>
        </div>

        {/* Active order */}
        {activeOrder ? (
          <div className="card">
            <h2 className="font-semibold mb-3">Commande active</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">#{activeOrder.id.substring(0, 8)}</span>
                <span className="badge badge-info capitalize">
                  {activeOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>📍 {activeOrder.pickup_location.address}</p>
                <p>🎯 {activeOrder.dropoff_location.address}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/driver/active/${activeOrder.id}`)}
              className="w-full btn btn-primary"
            >
              Voir détails
            </button>
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-semibold mb-2">Aucune commande active</h3>
            <p className="text-sm text-gray-600 mb-4">
              {driver.online_status === 'online'
                ? 'En attente de nouvelles commandes...'
                : 'Passez en ligne pour recevoir des commandes'}
            </p>
          </div>
        )}

        {/* Onboarding status */}
        {!driver.onboarding_completed && (
          <div className="card bg-yellow-50 border-yellow-200">
            <h2 className="font-semibold mb-2">⚠️ Profil incomplet</h2>
            <p className="text-sm text-gray-700 mb-4">
              Complétez votre profil pour recevoir des commandes
            </p>
            <button className="btn btn-primary">
              Compléter le profil
            </button>
          </div>
        )}

        {/* Quick stats */}
        <div className="card">
          <h2 className="font-semibold mb-3">Statistiques</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Vérifié:</span>
              <span className={driver.is_verified ? 'text-green-600' : 'text-red-600'}>
                {driver.is_verified ? '✓ Oui' : '✗ Non'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Onboarding:</span>
              <span className={driver.onboarding_completed ? 'text-green-600' : 'text-yellow-600'}>
                {driver.onboarding_completed ? '✓ Complété' : '⏳ En cours'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type véhicule:</span>
              <span className="capitalize">{driver.vehicle_type}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
