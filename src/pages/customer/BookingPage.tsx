import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { SERVICE_TYPES, VEHICLE_TYPES } from '@/config/constants'

export default function BookingPage() {
  const { serviceType } = useParams<{ serviceType: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    service_type: serviceType || SERVICE_TYPES.STANDARD,
    vehicle_type: VEHICLE_TYPES.MOTO,
    pickup: {
      address: '',
      city_id: '',
      latitude: 0,
      longitude: 0,
      contact_name: '',
      contact_phone: '',
    },
    dropoff: {
      address: '',
      city_id: '',
      latitude: 0,
      longitude: 0,
      contact_name: '',
      contact_phone: '',
    },
    cargo: {
      description: '',
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      fragile: false,
      value: 0,
    },
    cash_at_pickup: 0,
    cash_at_delivery: 0,
  })

  useEffect(() => {
    loadCities()
  }, [])

  const loadCities = async () => {
    const { data } = await supabase.from('cities').select('*').eq('is_active', true)
    setCities(data || [])
  }

  const calculatePrice = () => {
    // Logique de calcul de prix simplifiée
    let base = 1000
    if (formData.vehicle_type === VEHICLE_TYPES.CAR) base = 1500
    if (formData.vehicle_type === VEHICLE_TYPES.VAN) base = 3000
    if (formData.vehicle_type === VEHICLE_TYPES.TRUCK) base = 5000
    
    if (formData.service_type === SERVICE_TYPES.EXPRESS) base *= 1.5
    
    return Math.round(base)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const estimated_price = calculatePrice()
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user!.id,
          service_type: formData.service_type,
          vehicle_type: formData.vehicle_type,
          pickup_location: formData.pickup,
          dropoff_location: formData.dropoff,
          cargo: formData.cargo,
          estimated_price,
          cash_at_pickup: formData.cash_at_pickup,
          cash_at_delivery: formData.cash_at_delivery,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      // Créer event initial
      await supabase.from('order_events').insert({
        order_id: data.id,
        event_type: 'created',
        description: 'Commande créée',
      })

      navigate(`/track/${data.id}`)
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4">
        <button onClick={() => navigate(-1)} className="mb-2">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold">Nouvelle commande</h1>
        <p className="text-blue-100 text-sm">
          {serviceType === SERVICE_TYPES.EXPRESS ? 'Express' : 'Standard'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Type de véhicule */}
        {step === 1 && (
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Type de véhicule</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.values(VEHICLE_TYPES).map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, vehicle_type: type })}
                  className={`p-4 border-2 rounded-lg text-center ${
                    formData.vehicle_type === type
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {type === VEHICLE_TYPES.MOTO && '🏍️'}
                    {type === VEHICLE_TYPES.CAR && '🚗'}
                    {type === VEHICLE_TYPES.VAN && '🚐'}
                    {type === VEHICLE_TYPES.TRUCK && '🚛'}
                  </div>
                  <div className="font-medium capitalize">{type}</div>
                </button>
              ))}
            </div>

            <button onClick={() => setStep(2)} className="w-full btn btn-primary">
              Suivant
            </button>
          </div>
        )}

        {/* Step 2: Pickup */}
        {step === 2 && (
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Point de collecte</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <select
                value={formData.pickup.city_id}
                onChange={e => setFormData({
                  ...formData,
                  pickup: { ...formData.pickup, city_id: e.target.value }
                })}
                className="input"
              >
                <option value="">Sélectionner une ville</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                value={formData.pickup.address}
                onChange={e => setFormData({
                  ...formData,
                  pickup: { ...formData.pickup, address: e.target.value }
                })}
                className="input"
                placeholder="123 Rue de la Liberté"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact</label>
              <input
                type="text"
                value={formData.pickup.contact_name}
                onChange={e => setFormData({
                  ...formData,
                  pickup: { ...formData.pickup, contact_name: e.target.value }
                })}
                className="input"
                placeholder="Nom du contact"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.pickup.contact_phone}
                onChange={e => setFormData({
                  ...formData,
                  pickup: { ...formData.pickup, contact_phone: e.target.value }
                })}
                className="input"
                placeholder="+226 XX XX XX XX"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 btn btn-secondary">
                Retour
              </button>
              <button onClick={() => setStep(3)} className="flex-1 btn btn-primary">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Dropoff */}
        {step === 3 && (
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Point de livraison</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <select
                value={formData.dropoff.city_id}
                onChange={e => setFormData({
                  ...formData,
                  dropoff: { ...formData.dropoff, city_id: e.target.value }
                })}
                className="input"
              >
                <option value="">Sélectionner une ville</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                value={formData.dropoff.address}
                onChange={e => setFormData({
                  ...formData,
                  dropoff: { ...formData.dropoff, address: e.target.value }
                })}
                className="input"
                placeholder="456 Avenue de la Nation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact</label>
              <input
                type="text"
                value={formData.dropoff.contact_name}
                onChange={e => setFormData({
                  ...formData,
                  dropoff: { ...formData.dropoff, contact_name: e.target.value }
                })}
                className="input"
                placeholder="Nom du destinataire"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.dropoff.contact_phone}
                onChange={e => setFormData({
                  ...formData,
                  dropoff: { ...formData.dropoff, contact_phone: e.target.value }
                })}
                className="input"
                placeholder="+226 XX XX XX XX"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 btn btn-secondary">
                Retour
              </button>
              <button onClick={() => setStep(4)} className="flex-1 btn btn-primary">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Cargo + Paiement */}
        {step === 4 && (
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Détails du colis</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.cargo.description}
                onChange={e => setFormData({
                  ...formData,
                  cargo: { ...formData.cargo, description: e.target.value }
                })}
                className="input"
                rows={3}
                placeholder="Documents, vêtements, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Poids (kg)</label>
              <input
                type="number"
                value={formData.cargo.weight}
                onChange={e => setFormData({
                  ...formData,
                  cargo: { ...formData.cargo, weight: parseFloat(e.target.value) || 0 }
                })}
                className="input"
                step="0.1"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.cargo.fragile}
                  onChange={e => setFormData({
                    ...formData,
                    cargo: { ...formData.cargo, fragile: e.target.checked }
                  })}
                />
                <span className="text-sm">Fragile</span>
              </label>
            </div>

            <hr />

            <h3 className="font-semibold">Paiement (cash uniquement)</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Cash à la collecte (FCFA)
              </label>
              <input
                type="number"
                value={formData.cash_at_pickup}
                onChange={e => setFormData({
                  ...formData,
                  cash_at_pickup: parseFloat(e.target.value) || 0
                })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cash à la livraison (FCFA)
              </label>
              <input
                type="number"
                value={formData.cash_at_delivery}
                onChange={e => setFormData({
                  ...formData,
                  cash_at_delivery: parseFloat(e.target.value) || 0
                })}
                className="input"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Prix estimé</div>
              <div className="text-2xl font-bold text-blue-600">
                {calculatePrice()} FCFA
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="flex-1 btn btn-secondary">
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 btn btn-primary"
              >
                {loading ? 'Création...' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
