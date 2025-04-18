"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import type { Plan } from "@/lib/types"

export async function getFollowingUserPlans(): Promise<Plan[]> {
  try {
    const supabase = createServerSupabaseClient()

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      console.log("No active session found")
      return []
    }

    const currentUserId = sessionData.session.user.id
    console.log("Current user ID:", currentUserId)

    // Get IDs of users the current user is following
    const { data: followingData, error: followingError } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUserId)

    if (followingError) {
      console.error("Error fetching following data:", followingError)
      return []
    }

    if (!followingData || followingData.length === 0) {
      console.log("No followed users found in database")
      return []
    }

    // Extract the user IDs
    const followingIds = followingData.map((follow) => follow.following_id)
    console.log("Following IDs:", followingIds)

    // Get plans created by followed users
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select(`
        *,
        users:user_id (
          id,
          name,
          username,
          profile_picture
        )
      `)
      .in("user_id", followingIds)
      .is("canceled_at", null) // Exclude canceled plans
      .order("created_at", { ascending: false })

    if (plansError) {
      console.error("Error fetching following users' plans:", plansError)
      return []
    }

    console.log(`Found ${plans?.length || 0} plans from followed users`)
    return plans || []
  } catch (error) {
    console.error("Error in getFollowingUserPlans:", error)
    return []
  }
}

// Update the isFollowingAnyone function to be more reliable
export async function isFollowingAnyone(): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      return false
    }

    const currentUserId = sessionData.session.user.id

    // Count how many users the current user is following
    const { data, error } = await supabase.from("user_follows").select("following_id").eq("follower_id", currentUserId)

    if (error) {
      console.error("Error checking if following anyone:", error)
      return false
    }

    console.log(`User is following ${data?.length || 0} people:`, data)
    return (data?.length || 0) > 0
  } catch (error) {
    console.error("Error in isFollowingAnyone:", error)
    return false
  }
}
