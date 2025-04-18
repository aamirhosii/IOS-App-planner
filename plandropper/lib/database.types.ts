export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          title: string
          time: string
          location: string
          user_id: string
          user_name: string
          created_at: string
          category: string | null
          description: string | null
          max_participants: number | null
          latitude: number | null
          longitude: number | null
          canceled_at: string | null
          canceled_reason: string | null
          cost: number | null
          verify_status: boolean
          hotness_score: number | null
          daily_hotness_score: number | null
          weekly_hotness_score: number | null
          monthly_hotness_score: number | null
          view_count: number | null
          unique_view_count: number | null
          last_calculated_at: string | null
          suspicious_activity_detected: boolean | null
        }
        Insert: {
          id?: string
          title: string
          time: string
          location: string
          user_id: string
          user_name: string
          created_at?: string
          category?: string | null
          description?: string | null
          max_participants?: number | null
          latitude?: number | null
          longitude?: number | null
          canceled_at?: string | null
          canceled_reason?: string | null
          cost?: number | null
          verify_status?: boolean
          hotness_score?: number | null
          daily_hotness_score?: number | null
          weekly_hotness_score?: number | null
          monthly_hotness_score?: number | null
          view_count?: number | null
          unique_view_count?: number | null
          last_calculated_at?: string | null
          suspicious_activity_detected?: boolean | null
        }
        Update: {
          id?: string
          title?: string
          time?: string
          location?: string
          user_id?: string
          user_name?: string
          created_at?: string
          category?: string | null
          description?: string | null
          max_participants?: number | null
          latitude?: number | null
          longitude?: number | null
          canceled_at?: string | null
          canceled_reason?: string | null
          cost?: number | null
          verify_status?: boolean
          hotness_score?: number | null
          daily_hotness_score?: number | null
          weekly_hotness_score?: number | null
          monthly_hotness_score?: number | null
          view_count?: number | null
          unique_view_count?: number | null
          last_calculated_at?: string | null
          suspicious_activity_detected?: boolean | null
        }
      }
      plan_analytics: {
        Row: {
          id: string
          plan_id: string
          user_id: string | null
          visitor_ip: string | null
          visit_type: string
          created_at: string
          session_id: string | null
          is_creator_view: boolean
          is_potential_spam: boolean
        }
        Insert: {
          id?: string
          plan_id: string
          user_id?: string | null
          visitor_ip?: string | null
          visit_type: string
          created_at?: string
          session_id?: string | null
          is_creator_view?: boolean
          is_potential_spam?: boolean
        }
        Update: {
          id?: string
          plan_id?: string
          user_id?: string | null
          visitor_ip?: string | null
          visit_type?: string
          created_at?: string
          session_id?: string | null
          is_creator_view?: boolean
          is_potential_spam?: boolean
        }
      }
      // Other tables remain the same...
    }
    Views: {
      plan_analytics_summary: {
        Row: {
          plan_id: string
          title: string
          creator_id: string
          plan_created_at: string
          legitimate_views: number
          creator_views: number
          suspicious_views: number
          unique_legitimate_viewers: number
          hotness_score: number | null
          suspicious_activity_detected: boolean | null
        }
      }
    }
    // Other schema elements remain the same...
  }
}
