import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/config/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  phone: string
  full_name: string
  role: 'customer' | 'driver' | 'admin'
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows

      if (error) throw error
      
      if (!data) {
        console.warn('Profile not found for user:', userId)
        console.warn('User is authenticated but profile does not exist in the database')
        console.warn('This usually means the profile was not created during registration')
        setProfile(null)
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signInWithOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    })

    if (error) throw error
  }

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    signInWithOtp,
    verifyOtp,
    signOut,
    isAuthenticated: !!user,
    isCustomer: profile?.role === 'customer',
    isDriver: profile?.role === 'driver',
    isAdmin: profile?.role === 'admin',
  }
}
