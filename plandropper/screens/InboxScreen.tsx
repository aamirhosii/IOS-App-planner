"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native"
import { useSupabase } from "../contexts/SupabaseContext"
import { useAuth } from "../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import ConversationItem from "../components/ConversationItem"
import EventRequestItem from "../components/EventRequestItem"
import type { Conversation, EventRequest } from "../types"

export default function InboxScreen() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const navigation = useNavigation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("messages")

  const fetchConversations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc("get_user_conversations", { user_id_param: user.id })

      if (error) {
        console.error("Error fetching conversations:", error)
        return
      }

      setConversations(data || [])
    } catch (error) {
      console.error("Error in fetchConversations:", error)
    }
  }

  const fetchEventRequests = async () => {
    if (!user) return

    try {
      // Fetch plans created by the user
      const { data: userPlans, error: plansError } = await supabase.from("plans").select("id").eq("user_id", user.id)

      if (plansError) {
        console.error("Error fetching user plans:", plansError)
        return
      }

      if (!userPlans || userPlans.length === 0) {
        setEventRequests([])
        return
      }

      const planIds = userPlans.map((plan) => plan.id)

      // Fetch event requests for the user's plans
      const { data: requests, error: requestsError } = await supabase
        .from("event_requests")
        .select(`
          *,
          user:users(id, name),
          plan:plans(id, title)
        `)
        .in("plan_id", planIds)
        .order("created_at", { ascending: false })

      if (requestsError) {
        console.error("Error fetching event requests:", requestsError)
        return
      }

      setEventRequests(requests || [])
    } catch (error) {
      console.error("Error in fetchEventRequests:", error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([fetchConversations(), fetchEventRequests()])
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const navigateToConversation = (conversation: Conversation) => {
    // Navigation would be implemented here
    console.log("Navigate to conversation:", conversation.id)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "messages" && styles.activeTab]}
          onPress={() => setActiveTab("messages")}
        >
          <Text style={[styles.tabText, activeTab === "messages" && styles.activeTabText]}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => setActiveTab("requests")}
        >
          <Text style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>Requests</Text>
          {eventRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{eventRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : activeTab === "messages" ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ConversationItem conversation={item} onPress={() => navigateToConversation(item)} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>When you connect with others, your conversations will appear here</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={eventRequests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <EventRequestItem request={item} onRefresh={fetchEventRequests} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>When people want to join your plans, requests will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "#3b82f6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  activeTabText: {
    color: "white",
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
})
