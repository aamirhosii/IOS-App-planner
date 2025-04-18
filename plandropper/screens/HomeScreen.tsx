"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, RefreshControl, SafeAreaView, ActivityIndicator } from "react-native"
import { useSupabase } from "../contexts/SupabaseContext"
import PlanCard from "../components/PlanCard"
import HotPlansCarousel from "../components/HotPlansCarousel"
import type { Plan } from "../types"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"

export default function HomeScreen() {
  const { supabase } = useSupabase()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  const fetchPlans = async () => {
    try {
      let query = supabase.from("plans").select("*").is("canceled_at", null).order("created_at", { ascending: false })

      if (selectedCategory) {
        query = query.eq("category", selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching plans:", error)
        return
      }

      setPlans(data || [])
    } catch (error) {
      console.error("Error in fetchPlans:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Get unique categories from plans
      const { data, error } = await supabase.from("plans").select("category").is("canceled_at", null)

      if (error) {
        console.error("Error fetching categories:", error)
        return
      }

      const uniqueCategories = Array.from(new Set(data.map((item) => item.category).filter(Boolean)))
      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error in fetchCategories:", error)
    }
  }

  useEffect(() => {
    fetchPlans()
    fetchCategories()
  }, [selectedCategory])

  const onRefresh = () => {
    setRefreshing(true)
    fetchPlans()
    fetchCategories()
  }

  const renderCategoryItem = ({ item }: { item: string | null }) => (
    <View style={[styles.categoryItem, selectedCategory === item && styles.selectedCategoryItem]}>
      <Text
        style={[styles.categoryText, selectedCategory === item && styles.selectedCategoryText]}
        onPress={() => setSelectedCategory(item)}
      >
        {item || "All"}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>PlanDropper</Text>
        <View style={styles.searchButton}>
          <Ionicons name="search" size={22} color="#64748b" />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PlanCard plan={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <>
              <HotPlansCarousel />

              <Text style={styles.sectionTitle}>Categories</Text>
              <FlatList
                data={[null, ...categories]} // Add null for "All" category
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderCategoryItem}
                keyExtractor={(item, index) => (item || "all") + index}
                contentContainerStyle={styles.categoriesContainer}
              />

              <Text style={styles.sectionTitle}>Live Plans</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No plans available</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3b82f6",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 24,
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingBottom: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategoryItem: {
    backgroundColor: "#3b82f6",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  selectedCategoryText: {
    color: "white",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
  },
})
