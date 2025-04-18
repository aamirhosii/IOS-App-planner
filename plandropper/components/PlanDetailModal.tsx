"use client"

import { useState } from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSupabase } from "../contexts/SupabaseContext"
import { useAuth } from "../contexts/AuthContext"
import type { Plan } from "../types"
import MapView, { Marker } from "react-native-maps"
import { formatDistanceToNow } from "date-fns"

interface PlanDetailModalProps {
  visible: boolean
  onClose: () => void
  plan: Plan
  isOwner?: boolean
  onRefresh?: () => void
}

export default function PlanDetailModal({ visible, onClose, plan, isOwner = false, onRefresh }: PlanDetailModalProps) {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Social":
        return "people"
      case "Sports":
        return "basketball"
      case "Food":
        return "restaurant"
      case "Entertainment":
        return "film"
      case "Education":
        return "school"
      case "Business":
        return "briefcase"
      case "Travel":
        return "airplane"
      case "Video Games":
        return "game-controller"
      default:
        return "ellipsis-horizontal-circle"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Social":
        return "#3b82f6"
      case "Sports":
        return "#22c55e"
      case "Food":
        return "#f97316"
      case "Entertainment":
        return "#8b5cf6"
      case "Education":
        return "#06b6d4"
      case "Business":
        return "#64748b"
      case "Travel":
        return "#ec4899"
      case "Video Games":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  const handleCancelPlan = () => {
    Alert.alert("Cancel Plan", "Are you sure you want to cancel this plan?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("plans")
              .update({
                canceled_at: new Date().toISOString(),
                canceled_reason: "Canceled by user",
              })
              .eq("id", plan.id)

            if (error) {
              throw error
            }

            Alert.alert("Success", "Plan has been canceled")
            onClose()
            if (onRefresh) {
              onRefresh()
            }
          } catch (error) {
            console.error("Error canceling plan:", error)
            Alert.alert("Error", "Failed to cancel plan")
          }
        },
      },
    ])
  }

  const handleJoinRequest = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to join a plan")
      return
    }

    try {
      setSending(true)

      // Check if user already sent a request
      const { data: existingRequests, error: checkError } = await supabase
        .from("event_requests")
        .select("*")
        .eq("plan_id", plan.id)
        .eq("user_id", user.id)

      if (checkError) {
        throw checkError
      }

      if (existingRequests && existingRequests.length > 0) {
        Alert.alert("Already Requested", "You have already requested to join this plan")
        return
      }

      // Send join request
      const { error } = await supabase.from("event_requests").insert({
        plan_id: plan.id,
        user_id: user.id,
        message: message.trim() || null,
        status: "pending",
      })

      if (error) {
        throw error
      }

      Alert.alert("Success", "Your request to join has been sent")
      setMessage("")
      onClose()
    } catch (error) {
      console.error("Error sending join request:", error)
      Alert.alert("Error", "Failed to send join request")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Plan Details</Text>

            {isOwner && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCancelPlan}>
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{plan.title}</Text>

              <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: getCategoryColor(plan.category) }]}>
                  <Text style={styles.avatarText}>{plan.user_name?.charAt(0) || "U"}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{plan.user_name}</Text>
                  <Text style={styles.timeAgo}>{formatTime(plan.created_at)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="time-outline" size={20} color="#64748b" />
                </View>
                <Text style={styles.detailText}>{plan.time}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                </View>
                <Text style={styles.detailText}>{plan.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name={getCategoryIcon(plan.category)} size={20} color={getCategoryColor(plan.category)} />
                </View>
                <Text style={[styles.detailText, { color: getCategoryColor(plan.category) }]}>{plan.category}</Text>
              </View>

              {plan.cost !== null && plan.cost !== undefined && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="cash-outline" size={20} color="#64748b" />
                  </View>
                  <Text style={styles.detailText}>{plan.cost > 0 ? `$${plan.cost}` : "Free"}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="people-outline" size={20} color="#64748b" />
                </View>
                <Text style={styles.detailText}>
                  {plan.max_participants > 0 ? `Max ${plan.max_participants} participants` : "No participant limit"}
                </Text>
              </View>
            </View>

            {plan.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{plan.description}</Text>
              </View>
            )}

            {plan.latitude && plan.longitude && (
              <View style={styles.mapSection}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: plan.latitude,
                      longitude: plan.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: plan.latitude,
                        longitude: plan.longitude,
                      }}
                      title={plan.title}
                      description={plan.location}
                    />
                  </MapView>
                </View>
              </View>
            )}

            {!isOwner && (
              <View style={styles.joinSection}>
                <Text style={styles.sectionTitle}>Want to join?</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Add a message (optional)"
                  multiline
                  value={message}
                  onChangeText={setMessage}
                />
                <TouchableOpacity style={styles.joinButton} onPress={handleJoinRequest} disabled={sending}>
                  <Text style={styles.joinButtonText}>{sending ? "Sending Request..." : "Send Join Request"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  timeAgo: {
    fontSize: 14,
    color: "#94a3b8",
  },
  detailsSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#334155",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
  mapSection: {
    marginBottom: 24,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  joinSection: {
    marginBottom: 24,
  },
  messageInput: {
    height: 100,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    marginBottom: 16,
    textAlignVertical: "top",
  },
  joinButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
