"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function createUser(name: string, email: string, password: string, username: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single()

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    // Check if username is already taken
    const { data: existingUsername } = await supabase
      .from("users")
      .select("*")
      .eq("username", username.toLowerCase())
      .single()

    if (existingUsername) {
      return { error: "Username is already taken" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create a new user
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, username: username.toLowerCase() }])
      .select()

    if (error) {
      console.error("Error creating user:", error)
      return { error: "Failed to create user" }
    }

    return { success: true, userId: data[0].id }
  } catch (error) {
    console.error("Error creating user:", error)
    return { error: "Failed to create user" }
  }
}

export async function verifyCredentials(emailOrUsername: string, password: string) {
  try {
    const supabase = createServerSupabaseClient()
    let user

    // Check if input is an email
    const isEmail = emailOrUsername.includes("@")

    if (isEmail) {
      // Get user by email
      const { data, error } = await supabase.from("users").select("*").eq("email", emailOrUsername).single()

      if (error || !data) {
        console.log("User not found:", emailOrUsername)
        return null
      }

      user = data
    } else {
      // Get user by username
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", emailOrUsername.toLowerCase())
        .single()

      if (error || !data) {
        console.log("User not found by username:", emailOrUsername)
        return null
      }

      user = data
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      console.log("Password doesn't match for user:", emailOrUsername)
      return null
    }

    // Return user without password
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
    }
  } catch (error) {
    console.error("Error verifying credentials:", error)
    return null
  }
}
