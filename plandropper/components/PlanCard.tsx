"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSupabase } from "../contexts/SupabaseContext"
import { useAuth } from "../contexts/AuthContext"
import type { Plan } from "../types"
import { formatDistanceToNow } from "date-fns"
import PlanDetailModal from "./PlanDetailModal"

interface PlanCardProps {
  plan: Plan
  isOwner?: boolean
  onRefresh?: () => void
}

export default function PlanCard({ plan, isOwner = false, onRefresh }: PlanCardProps) {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [detailVisible, setDetailVisible] = useState(false)

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

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setDetailVisible(true)}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: getCategoryColor(plan.category) }]}>
              <Text style={styles.avatarText}>{plan.user_name?.charAt(0) || "U"}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{plan.user_name}</Text>
              <Text style={styles.timeAgo}>{formatTime(plan.created_at)}</Text>
            </View>
          </View>

          {isOwner && (
            <TouchableOpacity style={styles.menuButton} onPress={handleCancelPlan}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{plan.title}</Text>

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#64748b" />
              <Text style={styles.detailText}>{plan.time}</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.detailText}>{plan.location}</Text>
            </View>

            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(plan.category) + "20" }]}>
              <Ionicons name={getCategoryIcon(plan.category)} size={14} color={getCategoryColor(plan.category)} />
              <Text style={[styles.categoryText, { color: getCategoryColor(plan.category) }]}>{plan.category}</Text>
            </View>
          </View>

          {plan.description && (
            <Text style={styles.description} numberOfLines={2}>
              {plan.description}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          {plan.verify_status && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          {plan.hotness_score && plan.hotness_score > 50 && (
            <View style={styles.hotBadge}>
              <Ionicons name="flame" size={14} color="#ef4444" />
              <Text style={styles.hotText}>Hot</Text>
            </View>
          )}

          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <PlanDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        plan={plan}
        isOwner={isOwner}
        onRefresh={onRefresh}
      />
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  menuButton: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 4,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#22c55e",
    marginLeft: 4,
  },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  hotText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ef4444",
    marginLeft: 4,
  },
  joinButton: {
    marginLeft: "auto",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
})
