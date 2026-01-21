// Database types (auto-generated from Supabase)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string
          name: string
          slug: string
          latitude: number
          longitude: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          latitude: number
          longitude: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          latitude?: number
          longitude?: number
          is_active?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          phone: string
          full_name: string
          role: 'customer' | 'driver' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone: string
          full_name: string
          role?: 'customer' | 'driver' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          full_name?: string
          role?: 'customer' | 'driver' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          profile_id: string
          vehicle_type: 'moto' | 'car' | 'van' | 'truck'
          vehicle_plate: string
          vehicle_model: string | null
          primary_city_id: string
          license_url: string | null
          vehicle_registration_url: string | null
          insurance_url: string | null
          photo_url: string | null
          is_verified: boolean
          onboarding_completed: boolean
          online_status: 'offline' | 'online' | 'busy'
          push_token: string | null
          current_latitude: number | null
          current_longitude: number | null
          rating: number
          total_deliveries: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          vehicle_type: 'moto' | 'car' | 'van' | 'truck'
          vehicle_plate: string
          vehicle_model?: string | null
          primary_city_id: string
          license_url?: string | null
          vehicle_registration_url?: string | null
          insurance_url?: string | null
          photo_url?: string | null
          is_verified?: boolean
          onboarding_completed?: boolean
          online_status?: 'offline' | 'online' | 'busy'
          push_token?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          rating?: number
          total_deliveries?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          vehicle_type?: 'moto' | 'car' | 'van' | 'truck'
          vehicle_plate?: string
          vehicle_model?: string | null
          primary_city_id?: string
          license_url?: string | null
          vehicle_registration_url?: string | null
          insurance_url?: string | null
          photo_url?: string | null
          is_verified?: boolean
          onboarding_completed?: boolean
          online_status?: 'offline' | 'online' | 'busy'
          push_token?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          rating?: number
          total_deliveries?: number
          created_at?: string
          updated_at?: string
        }
      }
      driver_cities: {
        Row: {
          id: string
          driver_id: string
          city_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          city_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          city_id?: string
          is_active?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          driver_id: string | null
          service_type: 'standard' | 'express' | 'scheduled'
          vehicle_type: 'moto' | 'car' | 'van' | 'truck'
          pickup_location: Json
          dropoff_location: Json
          cargo: Json
          status: string
          estimated_price: number
          final_price: number | null
          payment_method: 'cash'
          cash_at_pickup: number
          cash_at_delivery: number
          cash_collected_pickup: number
          cash_collected_delivery: number
          payment_status: 'pending' | 'cash_due' | 'partial' | 'collected'
          scheduled_at: string | null
          assigned_at: string | null
          picked_up_at: string | null
          delivered_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          driver_id?: string | null
          service_type: 'standard' | 'express' | 'scheduled'
          vehicle_type: 'moto' | 'car' | 'van' | 'truck'
          pickup_location: Json
          dropoff_location: Json
          cargo: Json
          status?: string
          estimated_price: number
          final_price?: number | null
          payment_method?: 'cash'
          cash_at_pickup?: number
          cash_at_delivery?: number
          cash_collected_pickup?: number
          cash_collected_delivery?: number
          payment_status?: 'pending' | 'cash_due' | 'partial' | 'collected'
          scheduled_at?: string | null
          assigned_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          driver_id?: string | null
          service_type?: 'standard' | 'express' | 'scheduled'
          vehicle_type?: 'moto' | 'car' | 'van' | 'truck'
          pickup_location?: Json
          dropoff_location?: Json
          cargo?: Json
          status?: string
          estimated_price?: number
          final_price?: number | null
          payment_method?: 'cash'
          cash_at_pickup?: number
          cash_at_delivery?: number
          cash_collected_pickup?: number
          cash_collected_delivery?: number
          payment_status?: 'pending' | 'cash_due' | 'partial' | 'collected'
          scheduled_at?: string | null
          assigned_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_events: {
        Row: {
          id: string
          order_id: string
          event_type: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          event_type: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          event_type?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      order_photos: {
        Row: {
          id: string
          order_id: string
          uploaded_by: string
          photo_type: 'pickup' | 'delivery' | 'damage' | 'other'
          storage_bucket: string
          storage_path: string
          caption: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          uploaded_by: string
          photo_type: 'pickup' | 'delivery' | 'damage' | 'other'
          storage_bucket: string
          storage_path: string
          caption?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          uploaded_by?: string
          photo_type?: 'pickup' | 'delivery' | 'damage' | 'other'
          storage_bucket?: string
          storage_path?: string
          caption?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          order_id: string
          rated_by: string
          rated_user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          rated_by: string
          rated_user_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          rated_by?: string
          rated_user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      dispatch_attempts: {
        Row: {
          id: string
          order_id: string
          driver_id: string
          round_number: number
          status: 'sent' | 'accepted' | 'declined' | 'expired' | 'failed'
          decline_reason: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          driver_id: string
          round_number: number
          status?: 'sent' | 'accepted' | 'declined' | 'expired' | 'failed'
          decline_reason?: string | null
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          driver_id?: string
          round_number?: number
          status?: 'sent' | 'accepted' | 'declined' | 'expired' | 'failed'
          decline_reason?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      driver_accept_order: {
        Args: { order_id: string }
        Returns: { success: boolean; message: string }
      }
      driver_mark_arriving_pickup: {
        Args: { order_id: string }
        Returns: { success: boolean; message: string }
      }
      driver_mark_picked_up: {
        Args: { order_id: string }
        Returns: { success: boolean; message: string }
      }
      driver_mark_in_transit: {
        Args: { order_id: string }
        Returns: { success: boolean; message: string }
      }
      driver_add_pod_photo: {
        Args: {
          order_id: string
          bucket: string
          path: string
          caption?: string
          metadata?: Json
        }
        Returns: { success: boolean; message: string }
      }
      driver_mark_delivered: {
        Args: { order_id: string }
        Returns: { success: boolean; message: string }
      }
      driver_collect_cash: {
        Args: {
          order_id: string
          stage: 'pickup' | 'delivery'
          amount: number
        }
        Returns: { success: boolean; message: string }
      }
      customer_confirm_completed: {
        Args: { order_id: string }
        Returns: { success: boolean; message: string }
      }
      driver_decline_order: {
        Args: { order_id: string; reason?: string }
        Returns: { success: boolean; message: string }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
