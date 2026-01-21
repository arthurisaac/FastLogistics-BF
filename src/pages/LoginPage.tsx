import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const redirectUrl = window.location.origin + '/dashboard'
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
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
                Nous avons envoyé un lien de connexion à <strong>{email}</strong>
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
                  setEmail('')
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
          Connexion
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connexion rapide par email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                📧 Vous recevrez un lien de connexion par email
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Nouveau ?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/register')}
                className="w-full btn btn-secondary"
              >
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
