import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/config/supabase'

type AuthMethod = 'email' | 'phone'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email')
  const [step, setStep] = useState<'form' | 'verify' | 'email-sent'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    contact: '',
    full_name: '',
    role: 'customer' as 'customer' | 'driver',
    vehicle_type: 'moto' as 'moto' | 'car' | 'van' | 'truck',
    vehicle_plate: '',
    primary_city_id: '',
  })

  const [otp, setOtp] = useState('')
  const [cities, setCities] = useState<any[]>([])

  useEffect(() => {
    loadCities()
    checkAuthAndCreateProfile()
  }, [])

  const loadCities = async () => {
    const { data } = await supabase.from('cities').select('*').eq('is_active', true)
    setCities(data || [])
  }

  // Check if user just logged in via magic link or OTP
  const checkAuthAndCreateProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (existingProfile) {
        // Profile exists, redirect to dashboard
        navigate(existingProfile.role === 'driver' ? '/driver/dashboard' : '/dashboard')
        return
      }
      
      // Get stored registration data from localStorage
      const storedData = localStorage.getItem('registration_data')
      
      if (storedData) {
        const regData = JSON.parse(storedData)
        await createUserProfile(session.user.id, regData)
        localStorage.removeItem('registration_data')
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
      const isEmail = authMethod === 'email'

      if (isEmail) {
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
        setStep('email-sent')
      } else {
        // Send SMS OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone: formData.contact,
          options: {
            channel: 'sms',
          },
        })

        if (error) throw error
        setStep('verify')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        phone: formData.contact,
        token: otp,
        type: 'sms',
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erreur de vérification')

      // Create profile immediately after OTP verification
      await createUserProfile(authData.user.id, formData)
    } catch (err: any) {
      setError(err.message || 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  // Email sent screen
  if (step === 'email-sent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email envoyé !
              </h2>
              <p className="text-gray-600 mb-6">
                Vérifiez votre boîte email à <strong>{formData.contact}</strong>
              </p>
              
              <div className="bg-blue-50 rounded-xl p-4 text-left mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  📋 Étapes suivantes :
                </p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Ouvrez votre boîte email</li>
                  <li>Cliquez sur le lien "Log In"</li>
                  <li>Votre compte sera créé automatiquement</li>
                </ol>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                💡 Vérifiez aussi vos spams
              </p>

              <button
                onClick={() => {
                  setStep('form')
                  setFormData({ ...formData, contact: '' })
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Utiliser un autre email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // OTP verification screen
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🚚 FastLogistics BF
            </h1>
            <p className="text-blue-100">
              Vérification du code
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Code envoyé au {formData.contact}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form')
                    setOtp('')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Main registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚚 FastLogistics BF
          </h1>
          <p className="text-blue-100">
            Créer votre compte
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Auth Method Toggle */}
          <div className="bg-gray-50 p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email')
                  setFormData({ ...formData, contact: '' })
                  setError('')
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  authMethod === 'email'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone')
                  setFormData({ ...formData, contact: '' })
                  setError('')
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  authMethod === 'phone'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📱 Téléphone
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {authMethod === 'email' ? 'Email *' : 'Téléphone *'}
                </label>
                <input
                  type={authMethod === 'email' ? 'email' : 'tel'}
                  required
                  value={formData.contact}
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={authMethod === 'email' ? 'email@example.com' : '+226 XX XX XX XX'}
                />
              </div>
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
                  Envoi...
                </span>
              ) : (
                authMethod === 'email' ? 'Créer mon compte (Email)' : 'Créer mon compte (SMS)'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Déjà un compte ?</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
