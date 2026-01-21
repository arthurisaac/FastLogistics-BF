import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    phone: '',
    full_name: '',
    role: 'customer' as 'customer' | 'driver',
    // Driver specific
    vehicle_type: 'moto' as 'moto' | 'car' | 'van' | 'truck',
    vehicle_plate: '',
    primary_city_id: '',
  })

  const [cities, setCities] = useState<any[]>([])

  React.useEffect(() => {
    loadCities()
  }, [])

  const loadCities = async () => {
    const { data } = await supabase.from('cities').select('*').eq('is_active', true)
    setCities(data || [])
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Send OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: formData.phone,
        options: {
          channel: 'sms',
        },
      })

      if (error) throw error

      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du code')
    } finally {
      setLoading(false)
    }
  }

  const [otp, setOtp] = useState('')

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Verify OTP
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        phone: formData.phone,
        token: otp,
        type: 'sms',
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erreur de vérification')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          phone: formData.phone,
          full_name: formData.full_name,
          role: formData.role,
        })

      if (profileError) throw profileError

      // If driver, create driver entry
      if (formData.role === 'driver') {
        const { error: driverError } = await supabase
          .from('drivers')
          .insert({
            profile_id: authData.user.id,
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
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-4xl font-bold text-blue-600 mb-2">
          🚚 FastLogistics BF
        </h1>
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Créer un compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? 'Entrez vos informations' : 'Vérification du code'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="input mt-1"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="input mt-1"
                  placeholder="+226 XX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de compte
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'customer' })}
                    className={`p-4 border-2 rounded-lg text-center ${
                      formData.role === 'customer'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">👤</div>
                    <div className="font-medium">Client</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'driver' })}
                    className={`p-4 border-2 rounded-lg text-center ${
                      formData.role === 'driver'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚚</div>
                    <div className="font-medium">Chauffeur</div>
                  </button>
                </div>
              </div>

              {/* Driver specific fields */}
              {formData.role === 'driver' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type de véhicule
                    </label>
                    <select
                      value={formData.vehicle_type}
                      onChange={e => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                      className="input mt-1"
                    >
                      <option value="moto">🏍️ Moto</option>
                      <option value="car">🚗 Voiture</option>
                      <option value="van">🚐 Van</option>
                      <option value="truck">🚛 Camion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Plaque d'immatriculation
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_plate}
                      onChange={e => setFormData({ ...formData, vehicle_plate: e.target.value })}
                      className="input mt-1"
                      placeholder="BF-123-ABC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ville principale
                    </label>
                    <select
                      required
                      value={formData.primary_city_id}
                      onChange={e => setFormData({ ...formData, primary_city_id: e.target.value })}
                      className="input mt-1"
                    >
                      <option value="">Sélectionner une ville</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Recevoir le code'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Code de vérification
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input mt-1 text-center text-2xl tracking-widest"
                  placeholder="123456"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Code envoyé à {formData.phone}
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn btn-secondary"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Déjà un compte ? Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
