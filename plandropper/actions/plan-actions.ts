"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { PLAN_CATEGORIES } from "@/lib/types"

// Update the normalizeCategory function to match exactly with PLAN_CATEGORIES
const normalizeCategory = (category: string | null): string => {
  if (!category) return "Other"

  // Convert to lowercase for comparison
  const lowerCategory = category.toLowerCase()

  // Match with PLAN_CATEGORIES
  if (lowerCategory === "sport" || lowerCategory === "sports") {
    return "Sports"
  }
  if (lowerCategory === "food" || lowerCategory === "dining" || lowerCategory === "food & dining") {
    return "Food"
  }
  if (lowerCategory === "music" || lowerCategory === "concert" || lowerCategory === "entertainment") {
    return "Entertainment"
  }
  if (
    lowerCategory === "movie" ||
    lowerCategory === "movies" ||
    lowerCategory === "film" ||
    lowerCategory === "cinema"
  ) {
    return "Entertainment"
  }
  if (lowerCategory === "social" || lowerCategory === "party" || lowerCategory === "gathering") {
    return "Social"
  }
  if (lowerCategory === "education" || lowerCategory === "study" || lowerCategory === "learning") {
    return "Education"
  }
  if (lowerCategory === "business" || lowerCategory === "work" || lowerCategory === "networking") {
    return "Business"
  }
  if (lowerCategory === "travel" || lowerCategory === "trip" || lowerCategory === "journey") {
    return "Travel"
  }

  // Check if any category in PLAN_CATEGORIES matches (case insensitive)
  const matchedCategory = PLAN_CATEGORIES.find((c) => c.toLowerCase() === lowerCategory)

  if (matchedCategory) {
    return matchedCategory
  }

  // Default to "Other" if no match
  return "Other"
}

export async function createPlan(formData: FormData) {
  const userId = formData.get("userId") as string
  const userName = formData.get("userName") as string

  if (!userId) {
    throw new Error("You must be signed in to create a plan")
  }

  const title = formData.get("title") as string
  const time = formData.get("time") as string
  const location = formData.get("location") as string
  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const maxParticipantsStr = formData.get("maxParticipants") as string
  const costStr = formData.get("cost") as string
  const latitude = formData.get("latitude") as string
  const longitude = formData.get("longitude") as string

  // Validate required fields
  if (!title || !time || !location || !category) {
    throw new Error("Title, time, location, and category are required")
  }

  // Convert maxParticipants to number or null if empty
  const maxParticipants = maxParticipantsStr ? Number.parseInt(maxParticipantsStr, 10) : null

  // Convert cost to number (default to 0 if empty)
  const cost = costStr ? Number.parseFloat(costStr) : 0

  const supabase = createServerSupabaseClient()

  // Normalize the category
  const normalizedCategory = normalizeCategory(category)

  // Create the plan in the database
  const { data, error } = await supabase
    .from("plans")
    .insert([
      {
        title,
        time, // This is now an ISO string from the combined date and time
        location,
        user_id: userId,
        user_name: userName,
        category: normalizedCategory,
        description: description || null,
        max_participants: maxParticipants,
        cost: cost,
        verify_status: false, // Default to false for new plans
        latitude: latitude ? Number.parseFloat(latitude) : null,
        longitude: longitude ? Number.parseFloat(longitude) : null,
      },
    ])
    .select()

  if (error) {
    console.error("Error creating plan:", error)
    throw new Error("Failed to create plan")
  }

  revalidatePath("/")
  revalidatePath("/my-plans")
  revalidatePath("/dashboard")

  return data[0]
}

export async function updatePlan(data: FormData | Record<string, any>) {
  // Check if data is FormData or a regular object
  const isFormData = data instanceof FormData

  // Extract planId
  const planId = isFormData ? (data.get("planId") as string) : data.id

  if (!planId) {
    throw new Error("Plan ID is required")
  }

  // Extract other fields
  const title = isFormData ? (data.get("title") as string) : data.title
  const time = isFormData ? (data.get("time") as string) : data.time
  const location = isFormData ? (data.get("location") as string) : data.location
  const category = isFormData ? (data.get("category") as string) : data.category
  const description = isFormData ? (data.get("description") as string) : data.description
  const maxParticipantsStr = isFormData ? (data.get("maxParticipants") as string) : data.max_participants?.toString()
  const costStr = isFormData ? (data.get("cost") as string) : data.cost?.toString()

  // Validate required fields
  if (!title || !time || !location || !category) {
    throw new Error("Title, time, location, and category are required")
  }

  // Convert maxParticipants to number or null if empty
  const maxParticipants = maxParticipantsStr ? Number.parseInt(maxParticipantsStr, 10) : null

  // Convert cost to number (default to 0 if empty)
  const cost = costStr ? Number.parseFloat(costStr) : 0

  // Normalize the category
  const normalizedCategory = normalizeCategory(category)

  const supabase = createServerSupabaseClient()

  // First, verify that the plan exists
  const { data: existingPlan, error: fetchError } = await supabase.from("plans").select("*").eq("id", planId).single()

  if (fetchError || !existingPlan) {
    console.error("Error fetching plan:", fetchError)
    throw new Error("Failed to fetch plan")
  }

  // Update the plan in the database
  const { data: updatedData, error } = await supabase
    .from("plans")
    .update({
      title,
      time,
      location,
      category: normalizedCategory,
      description: description || null,
      max_participants: maxParticipants,
      cost: cost,
      // Note: We don't update verify_status here as that should be done by admins only
    })
    .eq("id", planId)
    .select()

  if (error) {
    console.error("Error updating plan:", error)
    throw new Error("Failed to update plan")
  }

  revalidatePath("/")
  revalidatePath("/my-plans")
  revalidatePath("/dashboard")

  return updatedData[0]
}

export async function deletePlan(planId: string, userId: string) {
  if (!planId || !userId) {
    throw new Error("Plan ID and user ID are required")
  }

  console.log("Deleting plan:", planId, "for user:", userId)

  const supabase = createServerSupabaseClient()

  // First, verify that the plan belongs to the user
  const { data: plan, error: fetchError } = await supabase.from("plans").select("user_id").eq("id", planId).single()

  if (fetchError) {
    console.error("Error fetching plan:", fetchError)
    throw new Error("Failed to fetch plan")
  }

  if (!plan || plan.user_id !== userId) {
    console.error("Permission denied. Plan user_id:", plan?.user_id, "Request user_id:", userId)
    throw new Error("You do not have permission to delete this plan")
  }

  // Delete the plan
  const { error: deleteError } = await supabase.from("plans").delete().eq("id", planId)

  if (deleteError) {
    console.error("Error deleting plan:", deleteError)
    throw new Error("Failed to delete plan")
  }

  revalidatePath("/")
  revalidatePath("/my-plans")
  revalidatePath("/dashboard")

  return { success: true }
}

// Add the cancelPlan function
export async function cancelPlan(planId: string, reason: string) {
  const supabase = createServerSupabaseClient()

  // 1. Get all participants for this plan
  const { data: participants } = await supabase.from("event_participants").select("user_id").eq("plan_id", planId)

  // 2. Get plan details
  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).single()

  if (!plan) {
    throw new Error("Plan not found")
  }

  // 3. Create notifications for all participants
  if (participants && participants.length > 0) {
    const notifications = participants.map((participant) => ({
      user_id: participant.user_id,
      type: "plan_canceled",
      title: "Plan Canceled",
      message: reason || `The plan "${plan.title}" has been canceled by the host.`,
      plan_id: planId,
      data: {
        plan_title: plan.title,
        reason: reason,
      },
    }))

    // Insert notifications
    await supabase.from("notifications").insert(notifications)
  }

  // 4. Update plan with canceled_at and canceled_reason
  await supabase
    .from("plans")
    .update({
      canceled_at: new Date().toISOString(),
      canceled_reason: reason || null,
    })
    .eq("id", planId)

  // 5. Revalidate paths
  revalidatePath("/")
  revalidatePath("/my-plans")
  revalidatePath("/dashboard")

  return { success: true }
}

// Add function to update plan verification status (for admin use)
export async function updatePlanVerificationStatus(planId: string, verifyStatus: boolean) {
  if (!planId) {
    throw new Error("Plan ID is required")
  }

  const supabase = createServerSupabaseClient()

  // Update the plan's verification status
  const { data, error } = await supabase
    .from("plans")
    .update({
      verify_status: verifyStatus,
    })
    .eq("id", planId)
    .select()

  if (error) {
    console.error("Error updating plan verification status:", error)
    throw new Error("Failed to update plan verification status")
  }

  revalidatePath("/")
  revalidatePath("/my-plans")
  revalidatePath("/dashboard")
  revalidatePath("/admin/plans") // For future admin panel

  return data[0]
}
