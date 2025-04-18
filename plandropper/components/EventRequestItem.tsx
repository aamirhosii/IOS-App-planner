"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSupabase } from "../contexts/SupabaseContext"
import type { EventRequest } from "../types"
import { formatDistanceToNow } from "date-fns"

interface EventRequestItemProps {
  request: EventRequest
  onRefresh: () => void
}

export default function EventRequestItem({ request, onRefresh }: EventRequestItemProps) {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "Invalid date"
    }
  }

  const handleAccept = async () => {
    try {
      setLoading(true)

      // Update request status
      const { error: updateError } = await supabase
        .from("event_requests")
        .update({ status: "accepted" })
        .eq("id", request.id)

      if (updateError) {
        throw updateError
      }

      // Add user as participant
      const { error: participantError } = await supabase.from("event_participants").insert({
        plan_id: request.plan_id,
        user_id: request.user_id,
      })

      if (participantError) {
        throw participantError
      }

      Alert.alert("Success", "Request accepted")
      onRefresh()
    } catch (error) {
      console.error("Error accepting request:", error)
      Alert.alert("Error", "Failed to accept request")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.from("event_requests").update({ status: "rejected" }).eq("id", request.id)

      if (error) {
        throw error
      }

      Alert.alert("Success", "Request rejected")
      onRefresh()
    } catch (error) {
      console.error("Error rejecting request:", error)
      Alert.alert("Error", "Failed to reject request")
    } finally {
      setLoading(false)
    }
  }

  // Don't show if not pending
  if (request.status !== "pending") {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{request.user?.name?.charAt(0) || "U"}</Text>
          </View>

          <View>
            <Text style={styles.name}>{request.user?.name}</Text>
            <Text style={styles.time}>{formatTime(request.created_at)}</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Pending</Text>
        </View>
      </View>

      <View style={styles.planInfo}>
        <Text style={styles.planTitle}>
          Wants to join: <Text style={styles.planName}>{request.plan?.title}</Text>
        </Text>
      </View>

      {request.message && (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{request.message}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={handleReject} disabled={loading}>
          <Ionicons name="close" size={20} color="#ef4444" />
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept} disabled={loading}>
          <Ionicons name="checkmark" size={20} color="#22c55e" />
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  time: {
    fontSize: 12,
    color: "#94a3b8",
  },
  badge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#d97706",
  },
  planInfo: {
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 14,
    color: "#64748b",
  },
  planName: {
    fontWeight: "600",
    color: "#334155",
  },
  messageContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
  },
  rejectButton: {
    backgroundColor: "#fee2e2",
    marginRight: 8,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 6,
  },
  acceptButton: {
    backgroundColor: "#dcfce7",
    marginLeft: 8,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22c55e",
    marginLeft: 6,
  },
})
