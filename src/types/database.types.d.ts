export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      absence_requests: {
        Row: {
          client_mutation_id: string
          created_at: string
          days: number[]
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          deleted_at: string | null
          id: string
          note: string | null
          status: 'submitted' | 'validated' | 'refused' | 'cancelled'
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          client_mutation_id: string
          created_at?: string
          days: number[]
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          deleted_at?: string | null
          id: string
          note?: string | null
          status?: 'submitted' | 'validated' | 'refused' | 'cancelled'
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          client_mutation_id?: string
          created_at?: string
          days?: number[]
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          deleted_at?: string | null
          id?: string
          note?: string | null
          status?: 'submitted' | 'validated' | 'refused' | 'cancelled'
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availabilities: {
        Row: {
          client_mutation_id: string
          created_at: string
          day_of_week: number
          declared_at: string
          deleted_at: string | null
          id: string
          note: string | null
          slot: 'full_day' | 'morning' | 'afternoon'
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          client_mutation_id: string
          created_at?: string
          day_of_week: number
          declared_at?: string
          deleted_at?: string | null
          id: string
          note?: string | null
          slot?: 'full_day' | 'morning' | 'afternoon'
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          client_mutation_id?: string
          created_at?: string
          day_of_week?: number
          declared_at?: string
          deleted_at?: string | null
          id?: string
          note?: string | null
          slot?: 'full_day' | 'morning' | 'afternoon'
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "availabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      presences: {
        Row: {
          check_in_accuracy: number
          check_in_lat: number
          check_in_lng: number
          check_in_time: string
          check_out_accuracy: number | null
          check_out_lat: number | null
          check_out_lng: number | null
          check_out_time: string | null
          client_mutation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          location_id: string
          status: 'present' | 'late' | 'completed'
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          check_in_accuracy: number
          check_in_lat: number
          check_in_lng: number
          check_in_time: string
          check_out_accuracy?: number | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_time?: string | null
          client_mutation_id: string
          created_at?: string
          deleted_at?: string | null
          id: string
          location_id: string
          status?: 'present' | 'late' | 'completed'
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          check_in_accuracy?: number
          check_in_lat?: number
          check_in_lng?: number
          check_in_time?: string
          check_out_accuracy?: number | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_time?: string | null
          client_mutation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_id?: string
          status?: 'present' | 'late' | 'completed'
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "presences_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          archived_at: string | null
          confirmed_at: string | null
          created_at: string
          deleted_at: string | null
          email: string
          expected_arrival_time: string
          expected_departure_time: string
          first_name: string
          full_name: string
          id: string
          is_active: boolean
          last_name: string
          role: 'employee' | 'manager' | 'admin'
          status: 'pending_validation' | 'active' | 'archived' | 'disabled'
          team_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          expected_arrival_time?: string
          expected_departure_time?: string
          first_name?: string
          full_name: string
          id: string
          is_active?: boolean
          last_name?: string
          role: 'employee' | 'manager' | 'admin'
          status?: 'pending_validation' | 'active' | 'archived' | 'disabled'
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          expected_arrival_time?: string
          expected_departure_time?: string
          first_name?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          role?: 'employee' | 'manager' | 'admin'
          status?: 'pending_validation' | 'active' | 'archived' | 'disabled'
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          id: string
          company_name: string
          expected_arrival_time: string
          expected_departure_time: string
          late_tolerance_minutes: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_name?: string
          expected_arrival_time?: string
          expected_departure_time?: string
          late_tolerance_minutes?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          expected_arrival_time?: string
          expected_departure_time?: string
          late_tolerance_minutes?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_role: { Args: never; Returns: string }
      get_auth_user_team_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Team = Tables<'teams'>
export type Profile = Tables<'profiles'>
export type Location = Tables<'locations'>
export type Presence = Tables<'presences'>
export type Availability = Tables<'availabilities'>
export type CompanySettings = Tables<'company_settings'>
