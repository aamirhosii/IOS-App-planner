"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function followUser(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      return { success: false, message: "You must be logged in to follow users" }
    }

    const currentUserId = sessionData.session.user.id
    const userIdToFollow = formData.get("userId") as string

    if (!userIdToFollow) {
      return { success: false, message: "No user ID provided" }
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("user_follows")
      .select("*")
      .eq("follower_id", currentUserId)
      .eq("following_id", userIdToFollow)
      .single()

    if (existingFollow) {
      console.log("Already following this user")
      return { success: true, message: "Already following this user" }
    }

    // Create the follow relationship
    const { error } = await supabase.from("user_follows").insert({
      follower_id: currentUserId,
      following_id: userIdToFollow,
    })

    if (error) {
      console.error("Error following user:", error)
      return { success: false, message: "Failed to follow user" }
    }

    // Revalidate the feed and profile pages
    revalidatePath("/feed")
    revalidatePath(`/profile/${userIdToFollow}`)

    return { success: true, message: "Successfully followed user" }
  } catch (error) {
    console.error("Error in followUser:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function unfollowUser(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      return { success: false, message: "You must be logged in to unfollow users" }
    }

    const currentUserId = sessionData.session.user.id
    const userIdToUnfollow = formData.get("userId") as string

    if (!userIdToUnfollow) {
      return { success: false, message: "No user ID provided" }
    }

    // Delete the follow relationship
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", userIdToUnfollow)

    if (error) {
      console.error("Error unfollowing user:", error)
      return { success: false, message: "Failed to unfollow user" }
    }

    // Revalidate the feed and profile pages
    revalidatePath("/feed")
    revalidatePath(`/profile/${userIdToUnfollow}`)

    return { success: true, message: "Successfully unfollowed user" }
  } catch (error) {
    console.error("Error in unfollowUser:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Add back the checkFollowStatus function that was missing
export async function checkFollowStatus(targetUserId: string): Promise<{ isFollowing: boolean }> {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user's session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      return { isFollowing: false } // Not logged in, so can't be following
    }

    const currentUserId = sessionData.session.user.id

    if (!currentUserId) {
      console.error("No user ID found in session")
      return { isFollowing: false }
    }

    // Check if a follow relationship exists
    const { data: existingFollow } = await supabase
      .from("user_follows")
      .select("*")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .single()

    return { isFollowing: !!existingFollow }
  } catch (error) {
    console.error("Error checking follow status:", error)
    return { isFollowing: false } // Assume not following in case of error
  }
}

export async function isFollowingUser(userId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      return false
    }

    const currentUserId = sessionData.session.user.id

    // Check if following
    const { data, error } = await supabase
      .from("user_follows")
      .select("*")
      .eq("follower_id", currentUserId)
      .eq("following_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      console.error("Error checking if following user:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in isFollowingUser:", error)
    return false
  }
}

export async function getFollowCounts(targetUserId: string): Promise<{ followers: number; following: number }> {
  try {
    const supabase = createServerSupabaseClient()

    // Get follower count
    const { count: followers, error: followersError } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId)

    if (followersError) {
      console.error("Error getting follower count:", followersError)
      throw followersError
    }

    // Get following count
    const { count: following, error: followingError } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUserId)

    if (followingError) {
      console.error("Error getting following count:", followingError)
      throw followingError
    }

    return { followers: followers || 0, following: following || 0 }
  } catch (error) {
    console.error("Error getting follow counts:", error)
    return { followers: 0, following: 0 }
  }
}
