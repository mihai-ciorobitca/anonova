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
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          created_at: string
          updated_at: string
          last_login: string | null
          credits: number
          has_used_free_credits: boolean
          current_plan: string
          subscription_status: string
          next_billing_date: string | null
          eth_wallet_address: string | null
          referral_code: string | null
          referred_by: string | null
          support_id: string | null
          settings: Json | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          is_super_admin: boolean
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
          credits?: number
          has_used_free_credits?: boolean
          current_plan?: string
          subscription_status?: string
          next_billing_date?: string | null
          eth_wallet_address?: string | null
          referral_code?: string | null
          referred_by?: string | null
          support_id?: string | null
          settings?: Json | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
          credits?: number
          has_used_free_credits?: boolean
          current_plan?: string
          subscription_status?: string
          next_billing_date?: string | null
          eth_wallet_address?: string | null
          referral_code?: string | null
          referred_by?: string | null
          support_id?: string | null
          settings?: Json | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean
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
  }
}
