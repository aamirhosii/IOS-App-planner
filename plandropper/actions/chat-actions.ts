"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Create a new conversation
export async function createConversation(senderId: string, recipientId: string, message?: string, title?: string) {
  if (!senderId || !recipientId) {
    return { error: "Sender ID and recipient ID are required" }
  }

  // Prevent users from messaging themselves
  if (senderId === recipientId) {
    return { error: "You cannot message yourself" }
  }

  const supabase = createServerSupabaseClient()

  try {
    // Instead of using the database function, directly query for existing conversations
    console.log(`Checking for existing conversation between ${senderId} and ${recipientId}`)

    // Find conversations where both users are participants
    const { data: senderParticipations, error: senderError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", senderId)

    if (senderError) {
      console.error("Error fetching sender participations:", senderError)
      return { error: "Failed to check for existing conversations" }
    }

    if (!senderParticipations || senderParticipations.length === 0) {
      console.log("No conversations found for sender")
      // No conversations for sender, create a new one
      return await createNewConversation(supabase, senderId, recipientId, message, title)
    }

    // Get all conversation IDs where sender is a participant
    const senderConversationIds = senderParticipations.map((p) => p.conversation_id)

    // Find conversations where recipient is also a participant
    const { data: recipientParticipations, error: recipientError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", recipientId)
      .in("conversation_id", senderConversationIds)

    if (recipientError) {
      console.error("Error fetching recipient participations:", recipientError)
      return { error: "Failed to check for existing conversations" }
    }

    let conversationId

    if (recipientParticipations && recipientParticipations.length > 0) {
      // Use the first conversation where both users are participants
      conversationId = recipientParticipations[0].conversation_id
      console.log(`Found existing conversation: ${conversationId}`)
    } else {
      console.log("No shared conversations found, creating new one")
      // No shared conversations, create a new one
      return await createNewConversation(supabase, senderId, recipientId, message, title)
    }

    // If a message is provided, add it to the existing conversation
    if (message) {
      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: message,
      })

      if (messageError) {
        console.error("Error sending message:", messageError)
        return { error: "Failed to send message" }
      }
    }

    // Update the conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    if (updateError) {
      console.error("Error updating conversation timestamp:", updateError)
      // Continue anyway, this is not critical
    }

    revalidatePath("/inbox")
    revalidatePath(`/inbox/${conversationId}`)

    return { conversationId }
  } catch (error) {
    console.error("Error in createConversation:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Helper function to create a new conversation
async function createNewConversation(
  supabase,
  senderId: string,
  recipientId: string,
  message?: string,
  title?: string,
) {
  // Create a new conversation
  const { data: newConversation, error: createError } = await supabase
    .from("conversations")
    .insert({
      title: title || null,
    })
    .select()
    .single()

  if (createError) {
    console.error("Error creating conversation:", createError)
    return { error: "Failed to create conversation" }
  }

  const conversationId = newConversation.id

  // Add participants to the conversation
  const { error: participantsError } = await supabase.from("conversation_participants").insert([
    {
      conversation_id: conversationId,
      user_id: senderId,
    },
    {
      conversation_id: conversationId,
      user_id: recipientId,
    },
  ])

  if (participantsError) {
    console.error("Error adding participants:", participantsError)
    return { error: "Failed to add participants to conversation" }
  }

  // Add the message to the conversation if provided
  if (message) {
    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: message,
    })

    if (messageError) {
      console.error("Error sending message:", messageError)
      return { error: "Failed to send message" }
    }
  }

  revalidatePath("/inbox")
  revalidatePath(`/inbox/${conversationId}`)

  return { conversationId }
}

// Find or create a conversation between two users
export async function findOrCreateConversation(senderId: string, recipientId: string) {
  if (!senderId || !recipientId) {
    return { error: "Sender ID and recipient ID are required" }
  }

  // Prevent users from messaging themselves
  if (senderId === recipientId) {
    return { error: "You cannot message yourself" }
  }

  const supabase = createServerSupabaseClient()

  try {
    // Instead of using the database function, directly query for existing conversations
    // Find conversations where both users are participants
    const { data: senderParticipations, error: senderError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", senderId)

    if (senderError) {
      console.error("Error fetching sender participations:", senderError)
      return { error: "Failed to check for existing conversations" }
    }

    if (!senderParticipations || senderParticipations.length === 0) {
      // No conversations for sender, create a new one
      return await createNewConversationWithoutMessage(supabase, senderId, recipientId)
    }

    // Get all conversation IDs where sender is a participant
    const senderConversationIds = senderParticipations.map((p) => p.conversation_id)

    // Find conversations where recipient is also a participant
    const { data: recipientParticipations, error: recipientError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", recipientId)
      .in("conversation_id", senderConversationIds)

    if (recipientError) {
      console.error("Error fetching recipient participations:", recipientError)
      return { error: "Failed to check for existing conversations" }
    }

    let conversationId

    if (recipientParticipations && recipientParticipations.length > 0) {
      // Use the first conversation where both users are participants
      conversationId = recipientParticipations[0].conversation_id
    } else {
      // No shared conversations, create a new one
      return await createNewConversationWithoutMessage(supabase, senderId, recipientId)
    }

    return { conversationId }
  } catch (error) {
    console.error("Error in findOrCreateConversation:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Helper function to create a new conversation without a message
async function createNewConversationWithoutMessage(supabase, senderId: string, recipientId: string) {
  // Create a new conversation
  const { data: newConversation, error: createError } = await supabase
    .from("conversations")
    .insert({
      title: null,
    })
    .select()
    .single()

  if (createError) {
    console.error("Error creating conversation:", createError)
    return { error: "Failed to create conversation" }
  }

  const conversationId = newConversation.id

  // Add participants to the conversation
  const { error: participantsError } = await supabase.from("conversation_participants").insert([
    {
      conversation_id: conversationId,
      user_id: senderId,
    },
    {
      conversation_id: conversationId,
      user_id: recipientId,
    },
  ])

  if (participantsError) {
    console.error("Error adding participants:", participantsError)
    return { error: "Failed to add participants to conversation" }
  }

  return { conversationId }
}

// Helper function to ensure users exist in the users table
async function ensureUsersExist(userIds: string[]) {
  const supabase = createServerSupabaseClient()

  for (const userId of userIds) {
    try {
      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found"
        console.error(`Error checking if user ${userId} exists:`, checkError)
        continue
      }

      if (!existingUser) {
        console.log(`User ${userId} not found in users table, attempting to create...`)

        // Get user data from auth
        const { data: userData, error: authError } = await supabase.auth.admin.getUserById(userId)

        if (authError || !userData?.user) {
          console.error(`Error getting auth data for user ${userId}:`, authError || "No user data returned")
          continue
        }

        const user = userData.user

        // Create user record
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          email: user.email || `${userId}@example.com`,
          username: user.user_metadata?.username || `user_${userId.substring(0, 8)}`,
          password: "placeholder", // This is just a placeholder as we're using Supabase Auth
        })

        if (insertError) {
          console.error(`Error creating user record for ${userId}:`, insertError)
        } else {
          console.log(`Created user record for ${userId}`)
        }
      }
    } catch (err) {
      console.error(`Error in ensureUserExists for ${userId}:`, err)
    }
  }
}

// Get all conversations for a user
export async function getUserConversations(userId: string) {
  if (!userId) {
    return { error: "User ID is required" }
  }

  const supabase = createServerSupabaseClient()

  try {
    // Get all conversations where the user is a participant
    const { data, error } = await supabase
      .from("conversation_participants")
      .select(
        `
        conversation_id,
        joined_at,
        last_read_at,
        conversations (
          id,
          title,
          created_at,
          updated_at
        ),
        conversations!inner (
          messages (
            id,
            sender_id,
            content,
            created_at,
            is_read,
            users (
              id,
              name
            )
          )
        )
      `,
      )
      .eq("user_id", userId)
      .order("last_read_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      return { error: "Failed to fetch conversations" }
    }

    // Process the data to get the last message for each conversation
    const conversations = data.map((item) => {
      const conversation = item.conversations
      const messages = conversation.messages || []

      // Sort messages by created_at in descending order
      messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const lastMessage = messages.length > 0 ? messages[0] : null

      // Count unread messages
      const unreadCount = messages.filter((msg) => msg.sender_id !== userId && !msg.is_read).length

      return {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message: lastMessage,
        unread_count: unreadCount,
      }
    })

    // Sort conversations by the last message's created_at in descending order
    conversations.sort((a, b) => {
      const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime()
      const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime()
      return bTime - aTime
    })

    return { conversations }
  } catch (error) {
    console.error("Error in getUserConversations:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get a single conversation with messages
export async function getConversation(conversationId: string, userId: string) {
  if (!conversationId || !userId) {
    return { error: "Conversation ID and User ID are required" }
  }

  const supabase = createServerSupabaseClient()

  try {
    // Get the conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single()

    if (conversationError) {
      console.error("Error fetching conversation:", conversationError)
      return { error: "Failed to fetch conversation" }
    }

    // Get the participants
    const { data: participants, error: participantsError } = await supabase
      .from("conversation_participants")
      .select(
        `
      user_id,
      joined_at,
      last_read_at,
      users (
        id,
        name,
        email,
        username,
        profile_picture
      )
    `,
      )
      .eq("conversation_id", conversationId)

    if (participantsError) {
      console.error("Error fetching participants:", participantsError)
      return { error: "Failed to fetch participants" }
    }

    // Get the messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        `
      id,
      sender_id,
      content,
      created_at,
      is_read,
      users (
        id,
        name,
        profile_picture
      )
    `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      return { error: "Failed to fetch messages" }
    }

    // Mark all messages as read
    const { error: updateError } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false)

    if (updateError) {
      console.error("Error marking messages as read:", updateError)
      // Continue anyway, this is not critical
    }

    // Update the last_read_at timestamp for the user
    const { error: updateParticipantError } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)

    if (updateParticipantError) {
      console.error("Error updating last_read_at:", updateParticipantError)
      // Continue anyway, this is not critical
    }

    // Get the other participant (for direct messages)
    const otherParticipant = participants.find((p) => p.user_id !== userId)?.users || null

    // Revalidate the inbox page to update unread counts
    revalidatePath("/inbox")

    return {
      conversation: {
        ...conversation,
        participants,
        messages,
        otherParticipant,
      },
    }
  } catch (error) {
    console.error("Error in getConversation:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Send a message in a conversation
export async function sendMessage(conversationId: string, senderId: string, content: string) {
  if (!conversationId || !senderId || !content) {
    return { error: "Conversation ID, sender ID, and content are required" }
  }

  const supabase = createServerSupabaseClient()

  try {
    // Add the message to the conversation
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending message:", error)
      return { error: "Failed to send message" }
    }

    // Update the conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    if (updateError) {
      console.error("Error updating conversation timestamp:", updateError)
      // Continue anyway, this is not critical
    }

    revalidatePath(`/inbox/${conversationId}`)
    revalidatePath("/inbox")

    return { message: data }
  } catch (error) {
    console.error("Error in sendMessage:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Mark a conversation as read for a specific user
export async function markConversationAsRead(conversationId: string, userId: string) {
  if (!conversationId || !userId) {
    return { error: "Conversation ID and User ID are required" }
  }

  const supabase = createServerSupabaseClient()

  try {
    // Mark all messages as read
    const { error: updateMessagesError } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false)

    if (updateMessagesError) {
      console.error("Error marking messages as read:", updateMessagesError)
      return { error: "Failed to mark messages as read" }
    }

    // Update the last_read_at timestamp for the user
    const { error: updateParticipantError } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)

    if (updateParticipantError) {
      console.error("Error updating last_read_at:", updateParticipantError)
      return { error: "Failed to update last read timestamp" }
    }

    revalidatePath("/inbox")
    revalidatePath(`/inbox/${conversationId}`)

    return { success: true }
  } catch (error) {
    console.error("Error in markConversationAsRead:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Delete a message
export async function deleteMessage(messageId: string) {
  if (!messageId) {
    return { error: "Message ID is required" }
  }

  const supabase = createServerSupabaseClient()

  try {
    // Delete the message
    const { error } = await supabase.from("messages").delete().eq("id", messageId)

    if (error) {
      console.error("Error deleting message:", error)
      return { error: "Failed to delete message" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteMessage:", error)
    return { error: "An unexpected error occurred" }
  }
}
