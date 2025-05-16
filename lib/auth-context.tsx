"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: string
  email: string
  name?: string
  role: string // Changed from specific "user" | "admin" type to string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, securityCode?: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Export as a named export again to match existing imports
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Helper function to extract name from email if name is not provided
  const getNameFromEmail = (email: string): string => {
    return email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const loadUser = async () => {
    try {
      console.log("[Auth] Loading user session")
      setIsLoading(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.log("[Auth] No active session found")
        setUser(null)
        return
      }

      console.log("[Auth] Session found for user:", session.user.id)

      // First check if profile exists
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)

      if (profilesError) {
        console.error("[Auth] Profiles fetch error:", profilesError.message)
        setUser(null)
        return
      }

      // If no profile exists, create one
      if (!profiles || profiles.length === 0) {
        console.log("[Auth] No profile found, creating one")

        const name = getNameFromEmail(session.user.email || "")

        // First, let's check what roles are allowed in the database
        const { data: roleInfo, error: roleError } = await supabase
          .from("information_schema.columns")
          .select("udt_name, column_default, is_nullable, character_maximum_length")
          .eq("table_name", "profiles")
          .eq("column_name", "role")
          .single()

        if (roleError) {
          console.error("[Auth] Error fetching role constraints:", roleError.message)
        }

        console.log("[Auth] Role column info:", roleInfo)

        // Insert with default role (let the database set the default)
        const { error: insertError } = await supabase.from("profiles").insert({
          id: session.user.id,
          email: session.user.email,
          name: name,
          // Don't specify role, let the database use its default value
        })

        if (insertError) {
          console.error("[Auth] Error creating profile:", insertError.message)
          setUser(null)
          return
        }

        // Fetch the newly created profile to get the default role
        const { data: newProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (fetchError) {
          console.error("[Auth] Error fetching new profile:", fetchError.message)
          setUser(null)
          return
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: name,
          role: newProfile.role,
        })
      } else {
        // Profile exists, use the first one
        const profile = profiles[0]
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: profile.name,
          role: profile.role,
        })
        console.log("[Auth] User profile loaded:", profile)
      }
    } catch (err) {
      console.error("[Auth] Unexpected error:", err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[Auth] Auth state changed:", session ? "logged in" : "logged out")
      if (session?.user) {
        loadUser()
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] Attempting to sign in:", email)
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error("[Auth] Sign-in error:", error.message)
        throw error
      }

      if (!data.session) {
        throw new Error("No session returned")
      }

      console.log("[Auth] Sign-in success, loading user profile")

      await loadUser()

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, securityCode?: string, name?: string) => {
    console.log("[Auth] Attempting to sign up:", email)
    setIsLoading(true)
    try {
      const isAdminRegistration = !!securityCode

      if (isAdminRegistration && securityCode !== "79041167197200060295") {
        throw new Error("Invalid security code")
      }

      const { error, data } = await supabase.auth.signUp({ email, password })

      if (error) {
        throw error
      }

      if (data.user) {
        // Use provided name or generate one from email
        const userName = name || getNameFromEmail(email)

        // Create profile without specifying role for regular users
        const profileData: any = {
          id: data.user.id,
          email: data.user.email,
          name: userName,
        }

        // Only set role for admin registrations
        if (isAdminRegistration) {
          // First, let's check what roles are allowed in the database
          const { data: roleInfo, error: roleError } = await supabase
            .from("information_schema.columns")
            .select("udt_name, column_default, is_nullable, character_maximum_length")
            .eq("table_name", "profiles")
            .eq("column_name", "role")
            .single()

          if (roleError) {
            console.error("[Auth] Error fetching role constraints:", roleError.message)
          } else {
            console.log("[Auth] Role column info:", roleInfo)

            // Let's try to set the role to 'admin' if it's an admin registration
            // If this fails, we'll handle it in the catch block
            profileData.role = "admin"
          }
        }

        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert(profileData)

        if (profileError) {
          console.error("[Auth] Error creating profile:", profileError.message)

          // If there was an error with the role, try again without specifying it
          if (profileError.message.includes("role")) {
            const { error: retryError } = await supabase.from("profiles").insert({
              id: data.user.id,
              email: data.user.email,
              name: userName,
            })

            if (retryError) {
              throw new Error("Failed to create user profile: " + retryError.message)
            }
          } else {
            throw new Error("Failed to create user profile: " + profileError.message)
          }
        }
      }

      toast({
        title: "Account created!",
        description: "You have successfully signed up.",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    console.log("[Auth] Signing out")
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    isAdmin: user?.role === "admin",
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
