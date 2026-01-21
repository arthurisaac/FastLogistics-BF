import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TYPES } from '@/config/constants'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">🚚</h1>
          <h1 className="text-4xl font-bold mb-2">FastLogistics BF</h1>
          <p className="text-blue-100 text-lg">
            Livraison rapide et fiable au Burkina Faso
          </p>
        </div>

        <div className="space-y-4 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Expédier un colis
            </h2>
            
            <div className="grid gap-4">
              <button
                onClick={() => navigate(`/book/${SERVICE_TYPES.STANDARD}`)}
                className="bg-white text-blue-600 hover:bg-blue-50 p-6 rounded-xl text-left transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg mb-1">📦 Standard</div>
                    <div className="text-sm text-gray-600">
                      Livraison le jour même
                    </div>
                  </div>
                  <div className="text-2xl">→</div>
                </div>
              </button>

              <button
                onClick={() => navigate(`/book/${SERVICE_TYPES.EXPRESS}`)}
                className="bg-white text-blue-600 hover:bg-blue-50 p-6 rounded-xl text-left transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg mb-1">⚡ Express</div>
                    <div className="text-sm text-gray-600">
                      Livraison en 2-3 heures
                    </div>
                  </div>
                  <div className="text-2xl">→</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Pourquoi nous choisir ?</h2>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span>Suivi en temps réel de vos commandes</span>
              </li>
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span>Drivers vérifiés et professionnels</span>
              </li>
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span>Paiement flexible (cash pickup/delivery)</span>
              </li>
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span>Photo de preuve de livraison (POD)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full btn bg-white text-blue-600 hover:bg-blue-50"
          >
            Se connecter
          </button>
          
          <button
            onClick={() => navigate('/register')}
            className="w-full btn bg-transparent border-2 border-white text-white hover:bg-white/10"
          >
            Créer un compte
          </button>
        </div>

        <div className="mt-12 text-center text-blue-100 text-sm">
          <p>Opérant à Ouagadougou, Bobo-Dioulasso, Koudougou</p>
        </div>
      </div>
    </div>
  )
}
