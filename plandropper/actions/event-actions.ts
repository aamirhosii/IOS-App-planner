"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Create a request to join an event
export async function createEventRequest(planId: string, userId: string, message?: string) {
  if (!planId || !userId) {
    throw new Error("Plan ID and user ID are required")
  }

  const supabase = createServerSupabaseClient()

  // Check if the user already has a pending request for this plan
  const { data: existingRequest, error: checkError } = await supabase
    .from("event_requests")
    .select("*")
    .eq("plan_id", planId)
    .eq("user_id", userId)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 is "not found"
    console.error("Error checking existing request:", checkError)
    throw new Error("Failed to check existing request")
  }

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      return { message: "You already have a pending request for this event" }
    } else if (existingRequest.status === "accepted") {
      return { message: "You are already a participant in this event" }
    } else {
      // If the request was rejected, allow them to request again
      const { error: updateError } = await supabase
        .from("event_requests")
        .update({
          status: "pending",
          message: message || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRequest.id)

      if (updateError) {
        console.error("Error updating request:", updateError)
        throw new Error("Failed to update request")
      }

      revalidatePath(`/plans/${planId}`)
      return { message: "Your request has been submitted" }
    }
  }

  // Check if the user is already a participant
  const { data: existingParticipant, error: participantError } = await supabase
    .from("event_participants")
    .select("*")
    .eq("plan_id", planId)
    .eq("user_id", userId)
    .single()

  if (participantError && participantError.code !== "PGRST116") {
    console.error("Error checking existing participant:", participantError)
    throw new Error("Failed to check if you're already a participant")
  }

  if (existingParticipant) {
    return { message: "You are already a participant in this event" }
  }

  // Check if the event has reached its maximum participants
  const { data: plan, error: planError } = await supabase.from("plans").select("*").eq("id", planId).single()

  if (planError) {
    console.error("Error fetching plan:", planError)
    throw new Error("Failed to fetch plan details")
  }

  // Count current participants
  const { count: participantCount, error: countError } = await supabase
    .from("event_participants")
    .select("*", { count: "exact", head: true })
    .eq("plan_id", planId)

  if (countError) {
    console.error("Error counting participants:", countError)
    throw new Error("Failed to check event capacity")
  }

  // Check if the event is full
  if (plan.max_participants !== null && participantCount !== null && participantCount >= plan.max_participants) {
    return { message: "This event is already full" }
  }

  // Create the request
  const { data, error } = await supabase
    .from("event_requests")
    .insert([
      {
        plan_id: planId,
        user_id: userId,
        message: message || null,
        status: "pending",
      },
    ])
    .select()

  if (error) {
    console.error("Error creating request:", error)
    throw new Error("Failed to create request")
  }

  revalidatePath(`/plans/${planId}`)
  return { message: "Your request has been submitted", request: data[0] }
}

// Accept a request to join an event
export async function acceptEventRequest(requestId: string, hostId: string) {
  if (!requestId || !hostId) {
    throw new Error("Request ID and host ID are required")
  }

  const supabase = createServerSupabaseClient()

  // Get the request details
  const { data: request, error: requestError } = await supabase
    .from("event_requests")
    .select("*, plans(*)")
    .eq("id", requestId)
    .single()

  if (requestError) {
    console.error("Error fetching request:", requestError)
    throw new Error("Failed to fetch request details")
  }

  // Verify that the host is the owner of the plan
  if (request.plans.user_id !== hostId) {
    throw new Error("You are not authorized to accept this request")
  }

  // Check if the request is already accepted
  if (request.status === "accepted") {
    return { message: "This request has already been accepted" }
  }

  // Check if the event has reached its maximum participants
  if (request.plans.max_participants !== null) {
    // Count current participants
    const { count: participantCount, error: countError } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", request.plan_id)

    if (countError) {
      console.error("Error counting participants:", countError)
      throw new Error("Failed to check event capacity")
    }

    // Check if the event is full
    if (participantCount !== null && participantCount >= request.plans.max_participants) {
      // Update the request status to rejected
      await supabase.from("event_requests").update({ status: "rejected" }).eq("id", requestId)
      return { message: "This event is already full" }
    }
  }

  // Update the request status
  const { error: updateError } = await supabase
    .from("event_requests")
    .update({ status: "accepted" })
    .eq("id", requestId)

  if (updateError) {
    console.error("Error updating request:", updateError)
    throw new Error("Failed to update request")
  }

  // Add the user as a participant
  const { error: participantError } = await supabase.from("event_participants").insert([
    {
      plan_id: request.plan_id,
      user_id: request.user_id,
    },
  ])

  if (participantError) {
    console.error("Error adding participant:", participantError)
    // Rollback the request status update
    await supabase.from("event_requests").update({ status: "pending" }).eq("id", requestId)
    throw new Error("Failed to add participant")
  }

  // Revalidate all relevant paths to ensure UI updates
  revalidatePath(`/plans/${request.plan_id}`)
  revalidatePath(`/my-plans`)
  revalidatePath(`/`) // Revalidate homepage to update plan cards
  return { message: "Request accepted successfully" }
}

// Reject a request to join an event
export async function rejectEventRequest(requestId: string, hostId: string) {
  if (!requestId || !hostId) {
    throw new Error("Request ID and host ID are required")
  }

  const supabase = createServerSupabaseClient()

  // Get the request details
  const { data: request, error: requestError } = await supabase
    .from("event_requests")
    .select("*, plans(*)")
    .eq("id", requestId)
    .single()

  if (requestError) {
    console.error("Error fetching request:", requestError)
    throw new Error("Failed to fetch request details")
  }

  // Verify that the host is the owner of the plan
  if (request.plans.user_id !== hostId) {
    throw new Error("You are not authorized to reject this request")
  }

  // Check if the request is already rejected
  if (request.status === "rejected") {
    return { message: "This request has already been rejected" }
  }

  // Update the request status
  const { error } = await supabase.from("event_requests").update({ status: "rejected" }).eq("id", requestId)

  if (error) {
    console.error("Error rejecting request:", error)
    throw new Error("Failed to reject request")
  }

  revalidatePath(`/plans/${request.plan_id}`)
  return { message: "Request rejected successfully" }
}

// Remove a participant from an event
export async function removeEventParticipant(participantId: string, hostId: string) {
  if (!participantId || !hostId) {
    throw new Error("Participant ID and host ID are required")
  }

  const supabase = createServerSupabaseClient()

  // Get the participant details
  const { data: participant, error: participantError } = await supabase
    .from("event_participants")
    .select("*, plans(*)")
    .eq("id", participantId)
    .single()

  if (participantError) {
    console.error("Error fetching participant:", participantError)
    throw new Error("Failed to fetch participant details")
  }

  // Verify that the host is the owner of the plan
  if (participant.plans.user_id !== hostId) {
    throw new Error("You are not authorized to remove this participant")
  }

  // Remove the participant
  const { error } = await supabase.from("event_participants").delete().eq("id", participantId)

  if (error) {
    console.error("Error removing participant:", error)
    throw new Error("Failed to remove participant")
  }

  // Revalidate all relevant paths
  revalidatePath(`/plans/${participant.plan_id}`)
  revalidatePath(`/my-plans`)
  revalidatePath(`/`) // Revalidate homepage
  return { message: "Participant removed successfully" }
}

// Get all requests for a plan
export async function getPlanRequests(planId: string, hostId: string) {
  if (!planId || !hostId) {
    throw new Error("Plan ID and host ID are required")
  }

  const supabase = createServerSupabaseClient()

  // Verify that the host is the owner of the plan
  const { data: plan, error: planError } = await supabase.from("plans").select("*").eq("id", planId).single()

  if (planError) {
    console.error("Error fetching plan:", planError)
    throw new Error("Failed to fetch plan details")
  }

  if (plan.user_id !== hostId) {
    throw new Error("You are not authorized to view these requests")
  }

  // Get all requests for the plan
  const { data, error } = await supabase
    .from("event_requests")
    .select("*, users(*)")
    .eq("plan_id", planId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching requests:", error)
    throw new Error("Failed to fetch requests")
  }

  return data
}

// Get all participants for a plan
export async function getPlanParticipants(planId: string) {
  if (!planId) {
    throw new Error("Plan ID is required")
  }

  const supabase = createServerSupabaseClient()

  // Get all participants for the plan
  const { data, error } = await supabase
    .from("event_participants")
    .select("*, users(*)")
    .eq("plan_id", planId)
    .order("joined_at", { ascending: false })

  if (error) {
    console.error("Error fetching participants:", error)
    throw new Error("Failed to fetch participants")
  }

  return data
}

// Update the checkUserRequestStatus function to properly handle withdrawn participants

// Find the checkUserRequestStatus function and replace it with this updated version:
export async function checkUserRequestStatus(planId: string, userId: string) {
  if (!planId || !userId) {
    throw new Error("Plan ID and user ID are required")
  }

  const supabase = createServerSupabaseClient()

  // First check if the user is already a participant
  const { data: participant, error: participantError } = await supabase
    .from("event_participants")
    .select("*")
    .eq("plan_id", planId)
    .eq("user_id", userId)
    .single()

  if (!participantError && participant) {
    return { status: "participant", data: participant }
  }

  if (participantError && participantError.code !== "PGRST116") {
    // PGRST116 is "not found"
    console.error("Error checking participant status:", participantError)
    throw new Error("Failed to check participant status")
  }

  // If not a participant, check if the user has a request for this plan
  // IMPORTANT: Only consider "accepted" status if there's a matching entry in event_participants
  const { data, error } = await supabase
    .from("event_requests")
    .select("*")
    .eq("plan_id", planId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found"
    console.error("Error checking request status:", error)
    throw new Error("Failed to check request status")
  }

  if (!data) {
    return { status: "none" }
  }

  // If status is "accepted" but there's no entry in event_participants,
  // the user has withdrawn - update the status to "withdrawn"
  if (data.status === "accepted" && !participant) {
    // Update the request status to "withdrawn"
    await supabase.from("event_requests").update({ status: "withdrawn" }).eq("id", data.id)

    // Return "none" status since they're not participating
    return { status: "none" }
  }

  return { status: data.status, data }
}

// Get all requests for a user
export async function getUserRequests(userId: string) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  const supabase = createServerSupabaseClient()

  // Get all requests made by the user
  const { data, error } = await supabase
    .from("event_requests")
    .select("*, plans(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching user requests:", error)
    throw new Error("Failed to fetch your requests")
  }

  return data
}

// Get all events a user is participating in
export async function getUserParticipations(userId: string) {
  const supabase = createServerSupabaseClient()

  // First get all participations
  const { data, error } = await supabase
    .from("event_participants")
    .select("*, plans(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })

  if (error) {
    console.error("Error fetching user participations:", error)
    throw error
  }

  // Then filter out participations for canceled plans
  return data.filter((participation) => participation.plans.canceled_at === null)
}

// Update the withdrawFromEvent function to ensure proper cleanup

// Find the withdrawFromEvent function and replace it with this updated version:
export async function withdrawFromEvent(participationId: string, userId: string) {
  if (!participationId || !userId) {
    throw new Error("Participation ID and user ID are required")
  }

  const supabase = createServerSupabaseClient()

  // Get the participation details to verify ownership
  const { data: participation, error: participationError } = await supabase
    .from("event_participants")
    .select("*, plans(*)")
    .eq("id", participationId)
    .single()

  if (participationError) {
    console.error("Error fetching participation:", participationError)
    throw new Error("Failed to fetch participation details")
  }

  // Verify that the user is the participant
  if (participation.user_id !== userId) {
    throw new Error("You are not authorized to withdraw from this event")
  }

  // Remove the participant
  const { error } = await supabase.from("event_participants").delete().eq("id", participationId)

  if (error) {
    console.error("Error withdrawing from event:", error)
    throw new Error("Failed to withdraw from event")
  }

  // Also update any requests to ensure they don't show as accepted
  const { error: requestError } = await supabase
    .from("event_requests")
    .update({ status: "withdrawn" })
    .eq("plan_id", participation.plan_id)
    .eq("user_id", userId)

  if (requestError) {
    console.error("Error updating request status:", requestError)
    // Continue anyway as the participant was already removed
  }

  // Revalidate all relevant paths
  revalidatePath(`/plans/${participation.plan_id}`)
  revalidatePath(`/my-plans`)
  revalidatePath(`/dashboard`)
  revalidatePath(`/`) // Revalidate homepage
  return { message: "Successfully withdrawn from event" }
}
