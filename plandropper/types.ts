export interface Plan {
  id: string
  title: string
  time: string
  location: string
  user_id: string
  user_name: string
  created_at: string
  category: string
  description: string
  max_participants: number
  latitude?: number
  longitude?: number
  verify_status: boolean
  cost?: number
  canceled_at?: string
  canceled_reason?: string
  hotness_score?: number
  daily_hotness_score?: number
  weekly_hotness_score?: number
  monthly_hotness_score?: number
  view_count?: number
  unique_view_count?: number
  last_calculated_at?: string
  suspicious_activity_detected?: boolean
}

export interface User {
  id: string
  name: string
  email: string
  username?: string
}

export interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  participants?: ConversationParticipant[]
  last_message?: Message
  unread_count?: number
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_at: string
  user?: User
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
  sender?: User
}

export interface EventRequest {
  id: string
  plan_id: string
  user_id: string
  message: string | null
  status: "pending" | "accepted" | "rejected" | "withdrawn"
  created_at: string
  updated_at: string
  user?: User
  plan?: Plan
}

export interface EventParticipant {
  id: string
  plan_id: string
  user_id: string
  joined_at: string
  user?: User
  plan?: Plan
}

export const PLAN_CATEGORIES = [
  "Social",
  "Sports",
  "Food",
  "Entertainment",
  "Education",
  "Business",
  "Travel",
  "Video Games",
  "Other",
] as const

export type PlanCategory = (typeof PLAN_CATEGORIES)[number]
