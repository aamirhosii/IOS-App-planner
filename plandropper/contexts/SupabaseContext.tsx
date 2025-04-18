"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { createClient } from "@supabase/supabase-js"
import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Use environment variables or fallback to these values
const supabaseUrl = process.env.SUPABASE_URL || "https://your-supabase-url.supabase.co"
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "your-supabase-anon-key"

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

type SupabaseContextType = {
  supabase: typeof supabase
}

const SupabaseContext = createContext<SupabaseContextType>({ supabase })

export const useSupabase = () => useContext(SupabaseContext)

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <SupabaseContext.Provider value={{ supabase }}>{children}</SupabaseContext.Provider>
}
