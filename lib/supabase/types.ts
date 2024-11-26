export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          settings: Json
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          settings?: Json
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          settings?: Json
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          week_start: string
          meals: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          meals: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          meals?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}