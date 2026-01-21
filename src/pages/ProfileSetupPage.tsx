import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'customer' as 'customer' | 'driver',
    vehicle_type: 'moto' as 'moto' | 'car' | 'van' | 'truck',
    vehicle_plate: '',
    primary_city_id: '',
  })

  const [cities, setCities] = useState<any[]>([])

  useEffect(() => {
    loadCities()
  }, [])

  const loadCities = async () => {
    const { data } = await supabase.from('cities').select('*').eq('is_active', true)
    setCities(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!user) throw new Error('User not authenticated')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          phone: user.phone || null,
          email: user.email || null,
          full_name: formData.full_name,
          role: formData.role,
        })

      if (profileError) throw profileError

      // If driver, create driver entry
      if (formData.role === 'driver') {
        const { error: driverError } = await supabase
          .from('drivers')
          .insert({
            profile_id: user.id,
            vehicle_type: formData.vehicle_type,
            vehicle_plate: formData.vehicle_plate,
            primary_city_id: formData.primary_city_id,
            onboarding_completed: false,
            is_verified: false,
            online_status: 'offline',
          })

        if (driverError) throw driverError
      }

      // Redirect based on role
      if (formData.role === 'driver') {
        navigate('/driver/dashboard')
      } else {
        navigate('/dashboard')
      }

      // Force reload to fetch the new profile
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚚 FastLogistics BF
          </h1>
          <p className="text-blue-100">
            Finaliser votre profil
          </p>
        </div>

        {/* Alert */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                Profil incomplet
              </h3>
              <p className="text-sm text-yellow-700">
                Votre compte a été créé mais votre profil est incomplet. 
                Veuillez remplir les informations ci-dessous pour continuer.
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jean Dupont"
              />
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">
                <strong>Email :</strong> {user?.email || 'Non renseigné'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Téléphone :</strong> {user?.phone || 'Non renseigné'}
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de compte *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`p-6 border-2 rounded-xl text-center transition-all ${
                    formData.role === 'customer'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">👤</div>
                  <div className="font-semibold text-lg">Client</div>
                  <div className="text-xs text-gray-500 mt-1">Envoyer des colis</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'driver' })}
                  className={`p-6 border-2 rounded-xl text-center transition-all ${
                    formData.role === 'driver'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🚚</div>
                  <div className="font-semibold text-lg">Chauffeur</div>
                  <div className="text-xs text-gray-500 mt-1">Livrer des colis</div>
                </button>
              </div>
            </div>

            {/* Driver specific fields */}
            {formData.role === 'driver' && (
              <div className="space-y-4 pt-4 border-t-2 border-gray-100">
                <h3 className="font-semibold text-gray-900">Informations véhicule</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de véhicule *
                    </label>
                    <select
                      value={formData.vehicle_type}
                      onChange={e => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="moto">🏍️ Moto</option>
                      <option value="car">🚗 Voiture</option>
                      <option value="van">🚐 Van</option>
                      <option value="truck">🚛 Camion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plaque d'immatriculation *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_plate}
                      onChange={e => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="BF-123-ABC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville principale *
                  </label>
                  <select
                    required
                    value={formData.primary_city_id}
                    onChange={e => setFormData({ ...formData, primary_city_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une ville</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création...
                </span>
              ) : (
                'Créer mon profil'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
