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
          first_name: string | null
          last_name: string | null
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
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
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
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
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
        }
      }
      extractions: {
        Row: {
          id: string
          user_id: string
          type: string
          target: string
          status: string
          credits_used: number
          total_records: number | null
          extracted_records: number
          error: string | null
          created_at: string
          updated_at: string
          last_processed_id: string | null
          settings: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          target: string
          status?: string
          credits_used: number
          total_records?: number | null
          extracted_records?: number
          error?: string | null
          created_at?: string
          updated_at?: string
          last_processed_id?: string | null
          settings?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          target?: string
          status?: string
          credits_used?: number
          total_records?: number | null
          extracted_records?: number
          error?: string | null
          created_at?: string
          updated_at?: string
          last_processed_id?: string | null
          settings?: Json | null
        }
      }
      extraction_data: {
        Row: {
          id: string
          extraction_id: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          extraction_id: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          extraction_id?: string
          data?: Json
          created_at?: string
        }
      }
      referral_earnings: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          amount: number
          status: string
          created_at: string
          updated_at: string
          eth_amount: number | null
          eth_price: number | null
          tx_hash: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          amount: number
          status?: string
          created_at?: string
          updated_at?: string
          eth_amount?: number | null
          eth_price?: number | null
          tx_hash?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          amount?: number
          status?: string
          created_at?: string
          updated_at?: string
          eth_amount?: number | null
          eth_price?: number | null
          tx_hash?: string | null
        }
      }
      payouts: {
        Row: {
          id: string
          user_id: string
          amount: number
          eth_amount: number
          eth_price: number
          status: string
          tx_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          eth_amount: number
          eth_price: number
          status?: string
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          eth_amount?: number
          eth_price?: number
          status?: string
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_pending_earnings: {
        Args: {
          user_id: string
        }
        Returns: {
          pending_amount: number
          available_amount: number
          total_amount: number
        }[]
      }
      process_payout: {
        Args: {
          user_id: string
          amount: number
          eth_price: number
        }
        Returns: string
      }
      process_referral: {
        Args: {
          referral_code: string
          new_user_id: string
        }
        Returns: boolean
      }
      start_extraction: {
        Args: {
          user_id: string
          extraction_type: string
          target: string
          credits_to_use: number
          settings?: Json
        }
        Returns: string
      }
      update_extraction_progress: {
        Args: {
          extraction_id: string
          new_status: string
          records_extracted?: number
          error_message?: string
          last_id?: string
        }
        Returns: void
      }
      update_user_credits: {
        Args: {
          user_id: string
          credit_change: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
