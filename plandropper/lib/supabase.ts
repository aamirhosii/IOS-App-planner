import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Create a single supabase client for server-side usage with service role
export const createServerSupabaseClient = () => {
  try {
    // Make sure we're using the environment variables and not localhost
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      throw new Error("Missing required environment variables for Supabase")
    }

    return createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error creating server Supabase client:", error)
    // Return a minimal client that will fail gracefully
    throw error
  }
}

// For server components that need auth context
export const createServerComponentSupabaseClient = async () => {
  try {
    // Dynamically import to avoid issues with SSR
    const { cookies } = await import("next/headers")
    const { createServerComponentClient } = await import("@supabase/auth-helpers-nextjs")

    return createServerComponentClient<Database>({
      cookies: () => cookies(),
    })
  } catch (error) {
    console.error("Error creating server component Supabase client:", error)
    throw error
  }
}

// Fix the multiple GoTrueClient instances issue by ensuring we only create one client

// Singleton instance
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// For client components - uses a true singleton pattern
export const createClientSupabaseClient = () => {
  if (typeof window === "undefined") {
    // Server-side rendering - create a new instance each time
    return createClientComponentClient<Database>({
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      },
    })
  }

  // Client-side - use singleton
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>({
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      },
    })
  }

  return clientInstance
}

// Handle auth errors and refresh token issues
export const handleAuthError = async (error: any) => {
  if (typeof window !== "undefined") {
    const supabase = createClientSupabaseClient()

    // If we get a refresh token error, sign out to clear the invalid state
    if (
      error?.message?.includes("refresh_token_not_found") ||
      error?.code === "refresh_token_not_found" ||
      error?.name === "AuthApiError"
    ) {
      try {
        await supabase.auth.signOut()
        console.log("Signed out due to auth error:", error)

        // Redirect to home page
        window.location.href = "/?auth_error=true"
      } catch (signOutError) {
        console.error("Error signing out:", signOutError)
      }
    }
  }
}

// Export a pre-created client for direct import in client components
// Restore this for backward compatibility with existing components
export const supabaseClient = typeof window !== "undefined" ? createClientSupabaseClient() : null
