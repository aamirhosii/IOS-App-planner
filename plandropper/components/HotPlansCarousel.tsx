"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from "react-native"
import { useSupabase } from "../contexts/SupabaseContext"
import { Ionicons } from "@expo/vector-icons"
import type { Plan } from "../types"
import PlanDetailModal from "./PlanDetailModal"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.8

export default function HotPlansCarousel() {
  const { supabase } = useSupabase()
  const [hotPlans, setHotPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)

  const fetchHotPlans = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .is("canceled_at", null)
        .order("hotness_score", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching hot plans:", error)
        return
      }

      setHotPlans(data || [])
    } catch (error) {
      console.error("Error in fetchHotPlans:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHotPlans()
  }, [])

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

  const handlePlanPress = (plan: Plan) => {
    setSelectedPlan(plan)
    setDetailVisible(true)
  }

  if (hotPlans.length === 0) {
    return null
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Hot Plans</Text>

        <FlatList
          data={hotPlans}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handlePlanPress(item)}>
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
                  <Ionicons name={getCategoryIcon(item.category)} size={14} color={getCategoryColor(item.category)} />
                  <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>{item.category}</Text>
                </View>

                <View style={styles.hotBadge}>
                  <Ionicons name="flame" size={14} color="#ef4444" />
                  <Text style={styles.hotText}>Hot</Text>
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <Text style={styles.detailText}>{item.time}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={14} color="#64748b" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: getCategoryColor(item.category) }]}>
                    <Text style={styles.avatarText}>{item.user_name?.charAt(0) || "U"}</Text>
                  </View>
                  <Text style={styles.userName} numberOfLines={1}>
                    {item.user_name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {selectedPlan && (
        <PlanDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          plan={selectedPlan}
          onRefresh={fetchHotPlans}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  listContent: {
    paddingRight: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "white",
    borderRadius: 16,
    marginLeft: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ef4444",
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    maxWidth: 120,
  },
})
