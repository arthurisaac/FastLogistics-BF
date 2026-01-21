/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { getSupabaseClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts'
import { sendPushNotification } from '../_shared/fcm.ts'

interface DispatchRequest {
  order_id: string
  ttl_seconds?: number
  batch_size?: number
  max_rounds?: number
  dry_run?: boolean
}

interface Driver {
  id: string
  profile_id: string
  vehicle_type: string
  push_token: string
  rating: number
  total_deliveries: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    // Parse request
    const body: DispatchRequest = await req.json()
    const {
      order_id,
      ttl_seconds = 120,
      batch_size = 5,
      max_rounds = 3,
      dry_run = false,
    } = body

    if (!order_id) {
      return errorResponse('order_id is required')
    }

    console.log(`🚀 Dispatching order ${order_id}`)
    console.log(`   TTL: ${ttl_seconds}s, Batch: ${batch_size}, Rounds: ${max_rounds}, Dry run: ${dry_run}`)

    const supabase = getSupabaseClient(req)

    // 1. Load order and verify status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return errorResponse('Order not found')
    }

    if (!['confirmed', 'no_driver_found'].includes(order.status)) {
      return errorResponse(`Invalid order status: ${order.status}`)
    }

    if (order.driver_id) {
      return errorResponse('Order already has a driver assigned')
    }

    const pickup = order.pickup_location
    const pickup_city_id = pickup.city_id
    const vehicle_type = order.vehicle_type

    // 2. Get eligible drivers
    console.log(`🔍 Finding eligible drivers...`)
    console.log(`   Vehicle type: ${vehicle_type}, City: ${pickup_city_id}`)

    let driversQuery = supabase
      .from('drivers')
      .select('id, profile_id, vehicle_type, push_token, rating, total_deliveries, primary_city_id')
      .eq('online_status', 'online')
      .eq('vehicle_type', vehicle_type)
      .eq('onboarding_completed', true)
      .not('push_token', 'is', null)
      .order('rating', { ascending: false })
      .order('total_deliveries', { ascending: false })

    const { data: allDrivers, error: driversError } = await driversQuery

    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError)
      return errorResponse('Failed to fetch drivers')
    }

    if (!allDrivers || allDrivers.length === 0) {
      console.log('⚠️ No eligible drivers found')
      
      if (!dry_run) {
        await supabase
          .from('orders')
          .update({ status: 'no_driver_found' })
          .eq('id', order_id)

        await supabase.from('order_events').insert({
          order_id,
          event_type: 'no_driver_found',
          description: 'Aucun chauffeur disponible',
        })
      }

      return jsonResponse({
        success: false,
        message: 'No eligible drivers found',
        stats: {
          total_eligible: 0,
          dispatched: 0,
          rounds: 0,
        },
      })
    }

    // Filter drivers based on vehicle type and city
    let eligibleDrivers: Driver[] = []

    for (const driver of allDrivers) {
      let eligible = false

      if (['van', 'truck'].includes(driver.vehicle_type)) {
        // Van/Truck: check driver_cities OR primary_city
        const { data: driverCities } = await supabase
          .from('driver_cities')
          .select('city_id')
          .eq('driver_id', driver.id)
          .eq('is_active', true)

        const activeCityIds = driverCities?.map(dc => dc.city_id) || []
        
        if (activeCityIds.includes(pickup_city_id) || driver.primary_city_id === pickup_city_id) {
          eligible = true
        }
      } else {
        // Moto/Car: only primary_city
        if (driver.primary_city_id === pickup_city_id) {
          eligible = true
        }
      }

      // Check if driver already declined this order
      if (eligible) {
        const { data: declined } = await supabase
          .from('dispatch_attempts')
          .select('id')
          .eq('order_id', order_id)
          .eq('driver_id', driver.id)
          .eq('status', 'declined')
          .single()

        if (declined) {
          eligible = false
        }
      }

      if (eligible) {
        eligibleDrivers.push(driver as Driver)
      }
    }

    console.log(`✅ Found ${eligibleDrivers.length} eligible drivers`)

    if (eligibleDrivers.length === 0) {
      if (!dry_run) {
        await supabase
          .from('orders')
          .update({ status: 'no_driver_found' })
          .eq('id', order_id)

        await supabase.from('order_events').insert({
          order_id,
          event_type: 'no_driver_found',
          description: 'Aucun chauffeur disponible dans cette ville',
        })
      }

      return jsonResponse({
        success: false,
        message: 'No eligible drivers in this city',
        stats: {
          total_eligible: 0,
          dispatched: 0,
          rounds: 0,
        },
      })
    }

    // 3. Dispatch in rounds
    let totalDispatched = 0
    let round = 1

    if (!dry_run) {
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          dispatch_round: round,
          dispatch_started_at: new Date().toISOString(),
        })
        .eq('id', order_id)
    }

    while (round <= max_rounds && totalDispatched < eligibleDrivers.length) {
      const startIdx = (round - 1) * batch_size
      const endIdx = Math.min(startIdx + batch_size, eligibleDrivers.length)
      const batchDrivers = eligibleDrivers.slice(startIdx, endIdx)

      if (batchDrivers.length === 0) break

      console.log(`📤 Round ${round}: Dispatching to ${batchDrivers.length} drivers`)

      const expiresAt = new Date(Date.now() + ttl_seconds * 1000).toISOString()

      for (const driver of batchDrivers) {
        try {
          if (!dry_run) {
            // Create dispatch attempt
            const { error: attemptError } = await supabase
              .from('dispatch_attempts')
              .insert({
                order_id,
                driver_id: driver.id,
                round_number: round,
                status: 'sent',
                expires_at: expiresAt,
              })

            if (attemptError) {
              console.error(`❌ Failed to create dispatch_attempt for driver ${driver.id}:`, attemptError)
              continue
            }

            // Send push notification
            const pushSent = await sendPushNotification({
              token: driver.push_token,
              title: '🚚 Nouvelle commande disponible',
              body: `Commande #${order_id.substring(0, 8)} - ${vehicle_type}`,
              data: {
                order_id,
                type: 'new_order',
              },
            })

            if (pushSent) {
              console.log(`✅ Push sent to driver ${driver.id}`)
            } else {
              console.log(`⚠️ Push failed for driver ${driver.id}`)
              
              // Mark attempt as failed
              await supabase
                .from('dispatch_attempts')
                .update({ status: 'failed' })
                .eq('order_id', order_id)
                .eq('driver_id', driver.id)
                .eq('round_number', round)
            }
          }

          totalDispatched++
        } catch (error) {
          console.error(`❌ Error dispatching to driver ${driver.id}:`, error)
        }
      }

      // Wait for TTL or until order is accepted
      if (!dry_run && round < max_rounds) {
        console.log(`⏳ Waiting ${ttl_seconds}s for acceptance...`)
        
        // Poll for acceptance
        const pollInterval = 5000 // 5 seconds
        const maxPolls = Math.ceil((ttl_seconds * 1000) / pollInterval)
        
        let accepted = false
        for (let i = 0; i < maxPolls; i++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          
          const { data: updatedOrder } = await supabase
            .from('orders')
            .select('driver_id, status')
            .eq('id', order_id)
            .single()

          if (updatedOrder?.driver_id || updatedOrder?.status === 'driver_assigned') {
            console.log(`✅ Order accepted by driver ${updatedOrder.driver_id}`)
            accepted = true
            break
          }
        }

        if (accepted) {
          break
        }

        // Expire attempts from this round
        await supabase
          .from('dispatch_attempts')
          .update({ status: 'expired' })
          .eq('order_id', order_id)
          .eq('round_number', round)
          .eq('status', 'sent')

        console.log(`⏰ Round ${round} expired, moving to next round`)
      }

      round++
    }

    // Final check
    const { data: finalOrder } = await supabase
      .from('orders')
      .select('driver_id, status')
      .eq('id', order_id)
      .single()

    const wasAccepted = finalOrder?.driver_id !== null

    if (!dry_run && !wasAccepted) {
      await supabase
        .from('orders')
        .update({ status: 'no_driver_found' })
        .eq('id', order_id)

      await supabase.from('order_events').insert({
        order_id,
        event_type: 'no_driver_found',
        description: `Aucun chauffeur n'a accepté après ${round - 1} rounds`,
      })
    }

    return jsonResponse({
      success: wasAccepted,
      message: wasAccepted ? 'Order successfully assigned' : 'No driver accepted the order',
      stats: {
        total_eligible: eligibleDrivers.length,
        dispatched: totalDispatched,
        rounds: round - 1,
        accepted: wasAccepted,
        driver_id: finalOrder?.driver_id || null,
      },
    })

  } catch (error) {
    console.error('❌ Dispatch error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500)
  }
})
