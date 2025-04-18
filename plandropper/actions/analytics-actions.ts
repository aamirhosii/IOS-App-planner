"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { v4 as uuidv4 } from "uuid"

// Record a plan visit or interaction
export async function recordPlanInteraction(
  planId: string,
  interactionType: "view" | "click" | "request" | "join_request" = "view",
  sessionId?: string,
) {
  if (!planId) return { error: "Plan ID is required" }

  try {
    const supabase = createServerSupabaseClient()

    // Get user ID if authenticated
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id || null

    // Get visitor IP address (for anonymous tracking)
    const headersList = headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "0.0.0.0"

    // Create or use session ID (to group interactions)
    const session = sessionId || uuidv4()

    // Check if the viewer is the creator of the plan
    if (userId) {
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select("user_id")
        .eq("id", planId)
        .single()

      if (!planError && planData && planData.user_id === userId) {
        // This is the creator viewing their own plan
        // We'll still record it but mark it as a creator view
        const { error } = await supabase.from("plan_analytics").insert({
          plan_id: planId,
          user_id: userId,
          visitor_ip: ip,
          visit_type: `${interactionType}_creator`, // Mark as creator view
          session_id: session,
          is_creator_view: true, // Now we can use this column
        })

        if (error) throw error

        // Don't update hotness for creator views
        return { success: true, sessionId: session, isCreatorView: true }
      }
    }

    // Rate limiting - check for recent views from this IP or user
    const timeWindow = new Date()
    timeWindow.setHours(timeWindow.getHours() - 1) // 1 hour window

    const { count: recentViews, error: countError } = await supabase
      .from("plan_analytics")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", planId)
      .eq("visitor_ip", ip)
      .eq("visit_type", interactionType)
      .gte("created_at", timeWindow.toISOString())

    if (countError) throw countError

    // If there are more than 5 views from this IP in the last hour, mark as potential spam
    const isPotentialSpam = recentViews !== null && recentViews > 5

    // Record the interaction
    const { error } = await supabase.from("plan_analytics").insert({
      plan_id: planId,
      user_id: userId,
      visitor_ip: ip,
      visit_type: interactionType,
      session_id: session,
      is_creator_view: false, // Now we can use this column
      is_potential_spam: isPotentialSpam, // Now we can use this column
    })

    if (error) throw error

    // Only update plan view count for non-spam views
    if (!isPotentialSpam && interactionType === "view") {
      await updatePlanViewCount(planId)

      // Immediately calculate hotness score for this plan
      await calculateHotnessForSinglePlan(planId)
    }

    return {
      success: true,
      sessionId: session,
      isCreatorView: false,
      isPotentialSpam,
    }
  } catch (error) {
    console.error("Error recording plan interaction:", error)
    return { error: "Failed to record interaction" }
  }
}

// Update the plan's view count and unique view count
async function updatePlanViewCount(planId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Count total views (excluding creator views)
    const { count: viewCount, error: viewError } = await supabase
      .from("plan_analytics")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", planId)
      .eq("visit_type", "view")
      .eq("is_creator_view", false) // Now we can use this column

    if (viewError) throw viewError

    // Count unique viewers (by user_id or visitor_ip)
    const { data: uniqueData, error: uniqueError } = await supabase
      .from("plan_analytics")
      .select("user_id, visitor_ip")
      .eq("plan_id", planId)
      .eq("visit_type", "view")
      .eq("is_creator_view", false) // Now we can use this column

    if (uniqueError) throw uniqueError

    // Count unique viewers by combining user_id and visitor_ip
    const uniqueViewers = new Set()
    uniqueData.forEach((record) => {
      if (record.user_id) {
        uniqueViewers.add(record.user_id)
      } else if (record.visitor_ip) {
        uniqueViewers.add(record.visitor_ip)
      }
    })

    const uniqueCount = uniqueViewers.size

    // Update the plan with the new counts
    await supabase
      .from("plans")
      .update({
        view_count: viewCount || 0,
        unique_view_count: uniqueCount,
        last_calculated_at: new Date().toISOString(),
      })
      .eq("id", planId)

    return { success: true }
  } catch (error) {
    console.error("Error updating plan view count:", error)
    return { error: "Failed to update view count" }
  }
}

// Calculate hotness score for a single plan
export async function calculateHotnessForSinglePlan(planId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, created_at, user_id")
      .eq("id", planId)
      .single()

    if (planError) throw planError

    // Current time for calculations
    const now = new Date()
    const oneDayAgo = new Date(now)
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Get analytics for different time periods
    const [dailyData, weeklyData, monthlyData] = await Promise.all([
      supabase
        .from("plan_analytics")
        .select("created_at, user_id, visitor_ip, visit_type, is_creator_view, is_potential_spam")
        .eq("plan_id", planId)
        .eq("is_creator_view", false)
        .eq("is_potential_spam", false)
        .gte("created_at", oneDayAgo.toISOString()),

      supabase
        .from("plan_analytics")
        .select("created_at, user_id, visitor_ip, visit_type, is_creator_view, is_potential_spam")
        .eq("plan_id", planId)
        .eq("is_creator_view", false)
        .eq("is_potential_spam", false)
        .gte("created_at", oneWeekAgo.toISOString()),

      supabase
        .from("plan_analytics")
        .select("created_at, user_id, visitor_ip, visit_type, is_creator_view, is_potential_spam")
        .eq("plan_id", planId)
        .eq("is_creator_view", false)
        .eq("is_potential_spam", false)
        .gte("created_at", oneMonthAgo.toISOString()),
    ])

    if (dailyData.error) throw dailyData.error
    if (weeklyData.error) throw weeklyData.error
    if (monthlyData.error) throw monthlyData.error

    // Get engagement metrics (join requests, etc.)
    const [dailyJoinRequests, weeklyJoinRequests, monthlyJoinRequests] = await Promise.all([
      supabase.from("event_requests").select("id").eq("plan_id", planId).gte("created_at", oneDayAgo.toISOString()),

      supabase.from("event_requests").select("id").eq("plan_id", planId).gte("created_at", oneWeekAgo.toISOString()),

      supabase.from("event_requests").select("id").eq("plan_id", planId).gte("created_at", oneMonthAgo.toISOString()),
    ])

    // Get accepted participants
    const [dailyParticipants, weeklyParticipants, monthlyParticipants] = await Promise.all([
      supabase.from("event_participants").select("id").eq("plan_id", planId).gte("joined_at", oneDayAgo.toISOString()),

      supabase.from("event_participants").select("id").eq("plan_id", planId).gte("joined_at", oneWeekAgo.toISOString()),

      supabase
        .from("event_participants")
        .select("id")
        .eq("plan_id", planId)
        .gte("joined_at", oneMonthAgo.toISOString()),
    ])

    // Calculate hotness scores for different time periods with engagement metrics
    const dailyScore = calculateEnhancedHotnessScore(
      dailyData.data || [],
      now,
      dailyJoinRequests.data?.length || 0,
      dailyParticipants.data?.length || 0,
    )

    const weeklyScore = calculateEnhancedHotnessScore(
      weeklyData.data || [],
      now,
      weeklyJoinRequests.data?.length || 0,
      weeklyParticipants.data?.length || 0,
    )

    const monthlyScore = calculateEnhancedHotnessScore(
      monthlyData.data || [],
      now,
      monthlyJoinRequests.data?.length || 0,
      monthlyParticipants.data?.length || 0,
    )

    // Check for suspicious activity
    const suspiciousActivity = detectSuspiciousActivity(
      weeklyData.data || [],
      weeklyJoinRequests.data || [],
      plan.user_id,
    )

    // If suspicious activity is detected, reduce the scores
    const finalDailyScore = suspiciousActivity ? dailyScore * 0.5 : dailyScore
    const finalWeeklyScore = suspiciousActivity ? weeklyScore * 0.5 : weeklyScore
    const finalMonthlyScore = suspiciousActivity ? monthlyScore * 0.5 : monthlyScore

    // Update the plan with the new hotness scores
    const { error: updateError } = await supabase
      .from("plans")
      .update({
        daily_hotness_score: finalDailyScore,
        weekly_hotness_score: finalWeeklyScore,
        monthly_hotness_score: finalMonthlyScore,
        hotness_score: finalWeeklyScore, // Use weekly score as the default
        last_calculated_at: now.toISOString(),
        suspicious_activity_detected: suspiciousActivity,
      })
      .eq("id", planId)

    if (updateError) throw updateError

    // Revalidate the home page and hot plans page
    revalidatePath("/")
    revalidatePath("/hot-plans")

    return {
      success: true,
      scores: {
        daily: finalDailyScore,
        weekly: finalWeeklyScore,
        monthly: finalMonthlyScore,
      },
    }
  } catch (error) {
    console.error("Error calculating hotness for single plan:", error)
    return { error: "Failed to calculate hotness score" }
  }
}

// Calculate hotness scores for all plans
export async function calculateHotnessScores() {
  try {
    const supabase = createServerSupabaseClient()

    // Get all active plans
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("id, created_at, user_id")
      .is("canceled_at", null)

    if (plansError) throw plansError

    console.log(`Calculating hotness scores for ${plans.length} plans`)

    // Process each plan
    for (const plan of plans) {
      await calculateHotnessForSinglePlan(plan.id)
    }

    console.log("Hotness score calculation completed")

    // Revalidate the home page and hot plans page
    revalidatePath("/")
    revalidatePath("/hot-plans")

    return { success: true }
  } catch (error) {
    console.error("Error calculating hotness scores:", error)
    return { error: "Failed to calculate hotness scores" }
  }
}

// Enhanced hotness score calculation with engagement metrics
function calculateEnhancedHotnessScore(data: any[], now: Date, joinRequestsCount: number, participantsCount: number) {
  // Filter to only include view events
  const viewData = data.filter((record) => record.visit_type === "view")

  // Count total views
  const totalViews = viewData.length

  // If there are no views, return 0
  if (totalViews === 0 && joinRequestsCount === 0 && participantsCount === 0) {
    return 0
  }

  // Count unique viewers
  const uniqueViewers = new Set()
  viewData.forEach((record) => {
    if (record.user_id) {
      uniqueViewers.add(record.user_id)
    } else if (record.visitor_ip) {
      uniqueViewers.add(record.visitor_ip)
    }
  })
  const uniqueViewerCount = uniqueViewers.size

  // Calculate recency factor (more recent views have higher weight)
  let recencyScore = 0
  viewData.forEach((view) => {
    const viewTime = new Date(view.created_at)
    const hoursAgo = (now.getTime() - viewTime.getTime()) / (1000 * 60 * 60)
    // Views in the last 24 hours count more
    const recencyWeight = Math.max(0, 1 - hoursAgo / 168) // 168 hours = 7 days
    recencyScore += recencyWeight
  })

  // Calculate engagement score from join requests and participants
  // Each join request is worth 2 views, each participant is worth 3 views
  const engagementScore = joinRequestsCount * 2 + participantsCount * 3

  // Calculate final hotness score with engagement metrics
  // Formula: (total views × 0.2) + (unique viewers × 0.3) + (recency score × 0.2) + (engagement × 0.3)
  let hotnessScore = totalViews * 0.2 + uniqueViewerCount * 0.3 + recencyScore * 0.2 + engagementScore * 0.3

  // Ensure a minimum score if there are any views or engagement
  if (hotnessScore > 0 && hotnessScore < 0.1) {
    hotnessScore = 0.1
  }

  return hotnessScore
}

// Detect suspicious activity
function detectSuspiciousActivity(viewData: any[], joinRequests: any[], creatorId: string): boolean {
  // 1. High view count but no join requests (suspicious if > 50 views but no requests)
  // Increased from 20 to 50 to be more lenient
  if (viewData.length > 50 && joinRequests.length === 0) {
    return true
  }

  // 2. Check for unusual distribution of IPs (many views from similar IPs)
  const ipCounts: Record<string, number> = {}
  viewData.forEach((record) => {
    if (record.visitor_ip) {
      ipCounts[record.visitor_ip] = (ipCounts[record.visitor_ip] || 0) + 1
    }
  })

  // If any single IP has more than 25 views, that's suspicious
  // Increased from 10 to 25 to be more lenient
  const suspiciousIpCount = Object.values(ipCounts).some((count) => count > 25)
  if (suspiciousIpCount) {
    return true
  }

  // 3. Check for unusual timing patterns (many views in a short time)
  if (viewData.length >= 10) {
    // Increased from 5 to 10
    // Sort by timestamp
    const sortedViews = [...viewData].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    // Check for 10+ views within 2 minutes
    // Changed from 5+ views in 5 minutes to 10+ views in 2 minutes
    for (let i = 9; i < sortedViews.length; i++) {
      const timeDiff = new Date(sortedViews[i].created_at).getTime() - new Date(sortedViews[i - 9].created_at).getTime()
      if (timeDiff < 2 * 60 * 1000) {
        // 2 minutes in milliseconds
        return true
      }
    }
  }

  return false
}

// Get hot plans for a specific time period
export async function getHotPlans(period: "daily" | "weekly" | "monthly" = "weekly", limit = 5) {
  try {
    const supabase = createServerSupabaseClient()

    const scoreColumn = `${period}_hotness_score`

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .is("canceled_at", null)
      .eq("verify_status", true)
      .gt(scoreColumn as any, 0) // Only get plans with a score greater than 0
      .order(scoreColumn as any, { ascending: false })
      .limit(limit)

    if (error) throw error

    return { plans: data }
  } catch (error) {
    console.error(`Error fetching ${period} hot plans:`, error)
    return { error: `Failed to fetch ${period} hot plans` }
  }
}

// Manual trigger for hotness calculation (for testing)
export async function manualTriggerHotnessCalculation() {
  try {
    const result = await calculateHotnessScores()
    return result
  } catch (error) {
    console.error("Error in manual hotness calculation:", error)
    return { error: "Failed to manually calculate hotness scores" }
  }
}
