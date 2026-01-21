import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  
  const [formData, setFormData] = useState({
    contact: '', // Email or phone
    full_name: '',
    role: 'customer' as 'customer' | 'driver',
    // Driver specific
    vehicle_type: 'moto' as 'moto' | 'car' | 'van' | 'truck',
    vehicle_plate: '',
    primary_city_id: '',
  })

  const [cities, setCities] = useState<any[]>([])

  useEffect(() => {
    loadCities()
    checkAuthAndCreateProfile()
  }, [])

  const loadCities = async () => {
    const { data } = await supabase.from('cities').select('*').eq('is_active', true)
    setCities(data || [])
  }

  // Check if user just logged in via magic link
  const checkAuthAndCreateProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Get stored registration data from localStorage
      const storedData = localStorage.getItem('registration_data')
      
      if (storedData) {
        const regData = JSON.parse(storedData)
        await createUserProfile(session.user.id, regData)
        localStorage.removeItem('registration_data')
      } else {
        // User already exists, redirect to appropriate dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          navigate(profile.role === 'driver' ? '/driver/dashboard' : '/dashboard')
        }
      }
    }
  }

  const createUserProfile = async (userId: string, data: any) => {
    try {
      const isEmail = data.contact.includes('@')
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          phone: isEmail ? null : data.contact,
          email: isEmail ? data.contact : null,
          full_name: data.full_name,
          role: data.role,
        })

      if (profileError) throw profileError

      // If driver, create driver entry
      if (data.role === 'driver') {
        const { error: driverError } = await supabase
          .from('drivers')
          .insert({
            profile_id: userId,
            vehicle_type: data.vehicle_type,
            vehicle_plate: data.vehicle_plate,
            primary_city_id: data.primary_city_id,
            onboarding_completed: false,
            is_verified: false,
            online_status: 'offline',
          })

        if (driverError) throw driverError
      }

      // Redirect based on role
      navigate(data.role === 'driver' ? '/driver/dashboard' : '/dashboard')
    } catch (err: any) {
      console.error('Error creating profile:', err)
      setError(err.message || 'Erreur lors de la création du profil')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Detect if email or phone
      const isEmail = formData.contact.includes('@')
      
      if (!isEmail) {
        throw new Error('Seul l\'email est supporté pour le moment. Le SMS nécessite une configuration Twilio.')
      }

      // Store registration data in localStorage for after login
      localStorage.setItem('registration_data', JSON.stringify(formData))

      // Get current URL for redirect
      const redirectUrl = window.location.origin + '/register'
      
      // Send Magic Link
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.contact,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      })

      if (error) throw error

      setEmailSent(true)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  // If email sent, show success message
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-4xl font-bold text-blue-600 mb-2">
            📧 Email envoyé !
          </h1>
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-6xl mb-4">✉️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Vérifiez votre boîte email
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Nous avons envoyé un lien de connexion à <strong>{formData.contact}</strong>
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Étapes suivantes :</strong>
                </p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Ouvrez votre boîte email</li>
                  <li>Cliquez sur le lien "Log In"</li>
                  <li>Vous serez automatiquement connecté</li>
                </ol>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                💡 Si vous ne voyez pas l'email, vérifiez vos spams
              </p>
              <button
                onClick={() => {
                  setEmailSent(false)
                  setFormData({ ...formData, contact: '' })
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Utiliser un autre email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
          Inscription rapide par email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                Email
              </label>
              <input
                type="email"
                required
                value={formData.contact}
                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                className="input mt-1"
                placeholder="email@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                📧 Vous recevrez un lien de connexion par email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de compte
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.role === 'customer'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="font-medium">Client</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'driver' })}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.role === 'driver'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
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
              {loading ? 'Envoi...' : 'Créer mon compte'}
            </button>
          </form>

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
