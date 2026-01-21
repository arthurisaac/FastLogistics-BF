import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyOtp } = useAuthContext()
  const phone = location.state?.phone || ''
  
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOtp(phone, otp)
      // Redirect will be handled by AuthProvider
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Code incorrect')
    } finally {
      setLoading(false)
    }
  }

  if (!phone) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Vérification
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Code envoyé à {phone}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                Code de vérification
              </label>
              <div className="mt-1">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Vérification...' : 'Vérifier'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
