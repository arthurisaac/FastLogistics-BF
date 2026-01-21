import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'

type AuthMethod = 'email' | 'phone'

export default function LoginPage() {
  const navigate = useNavigate()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email')
  const [contact, setContact] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'input' | 'verify' | 'email-sent'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (authMethod === 'email') {
        // Send Magic Link
        const redirectUrl = window.location.origin + '/dashboard'
        
        const { error } = await supabase.auth.signInWithOtp({
          email: contact,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })

        if (error) throw error
        setStep('email-sent')
      } else {
        // Send SMS OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone: contact,
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
      const { data, error } = await supabase.auth.verifyOtp({
        phone: contact,
        token: otp,
        type: 'sms',
      })

      if (error) throw error
      if (!data.user) throw new Error('Erreur de vérification')

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        navigate(profile.role === 'driver' ? '/driver/dashboard' : '/dashboard')
      } else {
        // No profile, redirect to complete registration
        navigate('/register', { state: { phone: contact, userId: data.user.id } })
      }
    } catch (err: any) {
      setError(err.message || 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  // Email sent confirmation screen
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
                Vérifiez votre boîte email à <strong>{contact}</strong>
              </p>
              
              <div className="bg-blue-50 rounded-xl p-4 text-left mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  📋 Étapes suivantes :
                </p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Ouvrez votre boîte email</li>
                  <li>Cliquez sur le lien "Log In"</li>
                  <li>Vous serez automatiquement connecté</li>
                </ol>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                💡 Vérifiez aussi vos spams
              </p>

              <button
                onClick={() => {
                  setStep('input')
                  setContact('')
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Retour
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
                  Code envoyé au {contact}
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
                    setStep('input')
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
                  {loading ? 'Vérification...' : 'Vérifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Main login screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚚 FastLogistics BF
          </h1>
          <p className="text-blue-100">
            Connexion à votre compte
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
                  setContact('')
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
                  setContact('')
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
          <form onSubmit={handleSendOtp} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {authMethod === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
              </label>
              <input
                type={authMethod === 'email' ? 'email' : 'tel'}
                required
                value={contact}
                onChange={e => setContact(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={authMethod === 'email' ? 'email@example.com' : '+226 XX XX XX XX'}
              />
              <p className="mt-2 text-xs text-gray-500">
                {authMethod === 'email' 
                  ? '📧 Vous recevrez un lien de connexion par email'
                  : '📱 Vous recevrez un code par SMS'}
              </p>
            </div>

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
                authMethod === 'email' ? 'Envoyer le lien' : 'Recevoir le code'
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
                <span className="px-4 bg-white text-gray-500">Nouveau sur FastLogistics ?</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              Créer un compte
            </button>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-blue-100 mt-6">
          Besoin d'aide ? <a href="/support" className="text-white font-medium hover:underline">Contactez-nous</a>
        </p>
      </div>
    </div>
  )
}
