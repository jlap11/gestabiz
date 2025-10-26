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
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'client' | 'employee' | 'admin'
          settings: Json | null
          is_active: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'client' | 'employee' | 'admin'
          settings?: Json | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'client' | 'employee' | 'admin'
          settings?: Json | null
          is_active?: boolean
        }
      }
      businesses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          owner_id: string
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          logo_url: string | null
          website: string | null
          business_hours: Json | null
          settings: Json | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          owner_id: string
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          logo_url?: string | null
          website?: string | null
          business_hours?: Json | null
          settings?: Json | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          owner_id?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          logo_url?: string | null
          website?: string | null
          business_hours?: Json | null
          settings?: Json | null
          is_active?: boolean
        }
      }
      locations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_id: string
          name: string
          address: string
          city: string
          state: string | null
          country: string
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id: string
          name: string
          address: string
          city: string
          state?: string | null
          country: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id?: string
          name?: string
          address?: string
          city?: string
          state?: string | null
          country?: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          is_active?: boolean
        }
      }
      business_employees: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_id: string
          employee_id: string
          role: 'employee' | 'manager'
          status: 'pending' | 'approved' | 'rejected'
          hired_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id: string
          employee_id: string
          role?: 'employee' | 'manager'
          status?: 'pending' | 'approved' | 'rejected'
          hired_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id?: string
          employee_id?: string
          role?: 'employee' | 'manager'
          status?: 'pending' | 'approved' | 'rejected'
          hired_at?: string | null
          is_active?: boolean
        }
      }
      services: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          currency: string
          category: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id: string
          name: string
          description?: string | null
          duration_minutes: number
          price: number
          currency?: string
          category?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          currency?: string
          category?: string | null
          is_active?: boolean
        }
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_id: string
          location_id: string | null
          service_id: string
          client_id: string
          employee_id: string | null
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          client_notes: string | null
          price: number | null
          currency: string | null
          payment_status: 'pending' | 'paid' | 'refunded' | null
          reminder_sent: boolean
          cancelled_at: string | null
          cancelled_by: string | null
          cancel_reason: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id: string
          location_id?: string | null
          service_id: string
          client_id: string
          employee_id?: string | null
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          client_notes?: string | null
          price?: number | null
          currency?: string | null
          payment_status?: 'pending' | 'paid' | 'refunded' | null
          reminder_sent?: boolean
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancel_reason?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          business_id?: string
          location_id?: string | null
          service_id?: string
          client_id?: string
          employee_id?: string | null
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          client_notes?: string | null
          price?: number | null
          currency?: string | null
          payment_status?: 'pending' | 'paid' | 'refunded' | null
          reminder_sent?: boolean
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancel_reason?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: 'appointment_reminder' | 'appointment_cancelled' | 'appointment_confirmed' | 'system'
          title: string
          message: string
          appointment_id: string | null
          read: boolean
          sent_via_email: boolean
          sent_via_push: boolean
          scheduled_for: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          type: 'appointment_reminder' | 'appointment_cancelled' | 'appointment_confirmed' | 'system'
          title: string
          message: string
          appointment_id?: string | null
          read?: boolean
          sent_via_email?: boolean
          sent_via_push?: boolean
          scheduled_for?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          type?: 'appointment_reminder' | 'appointment_cancelled' | 'appointment_confirmed' | 'system'
          title?: string
          message?: string
          appointment_id?: string | null
          read?: boolean
          sent_via_email?: boolean
          sent_via_push?: boolean
          scheduled_for?: string | null
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}