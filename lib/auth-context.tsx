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
  role: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    securityCode?: string,
    name?: string,
    captchaToken?: string,
  ) => Promise<void>
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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle() // Use maybeSingle to avoid errors if no profile exists

      if (profileError) {
        console.error("[Auth] Profiles fetch error:", profileError.message)
        setUser(null)
        return
      }

      // If no profile exists, create one using upsert
      if (!profile) {
        console.log("[Auth] No profile found, creating one")

        const name = getNameFromEmail(session.user.email || "")

        // Use upsert with on_conflict to handle potential race conditions
        const { error: upsertError } = await supabase.from("profiles").upsert(
          {
            id: session.user.id,
            email: session.user.email,
            name: name,
            role: "employee", // Valid role based on the constraint
          },
          { onConflict: "id" }, // Specify the conflict column
        )

        if (upsertError) {
          console.error("[Auth] Error creating profile:", upsertError.message)

          // If there's still an error, try to fetch the profile again
          // It might have been created by another concurrent process
          const { data: existingProfile, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (fetchError) {
            console.error("[Auth] Error fetching profile after upsert error:", fetchError.message)
            setUser(null)
            return
          }

          // Use the existing profile
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: existingProfile.name,
            role: existingProfile.role,
          })
          return
        }

        // Fetch the newly created profile
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
        // Profile exists, use it
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

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    console.log("[Auth] Attempting to sign in:", email)
    setIsLoading(true)
    try {
      // Use the provided captcha token if available
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined,
        },
      })

      if (error) {
        console.error("[Auth] Sign-in error:", error.message)

        // If the error is related to captcha, provide a more helpful message
        if (error.message.includes("captcha")) {
          throw new Error("Please complete the captcha verification to sign in.")
        }

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
      throw error
    }
  }

  const signUp = async (
    email: string,
    password: string,
    securityCode?: string,
    name?: string,
    captchaToken?: string,
  ) => {
    console.log("[Auth] Attempting to sign up:", email)
    setIsLoading(true)
    try {
      const isAdminRegistration = !!securityCode

      if (isAdminRegistration && securityCode !== "79041167197200060295") {
        throw new Error("Invalid security code")
      }

      // Use the provided captcha token if available
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined,
        },
      })

      if (error) {
        // If the error is related to captcha, provide a more helpful message
        if (error.message.includes("captcha")) {
          throw new Error("Please complete the captcha verification to sign up.")
        }

        throw error
      }

      if (data.user) {
        // Use provided name or generate one from email
        const userName = name || getNameFromEmail(email)

        // Create profile with appropriate role based on the constraint
        // Use upsert to handle potential race conditions
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email,
            name: userName,
            role: isAdminRegistration ? "admin" : "employee", // Valid roles based on the constraint
          },
          { onConflict: "id" },
        )

        if (profileError) {
          console.error("[Auth] Error creating profile:", profileError.message)
          throw new Error("Failed to create user profile: " + profileError.message)
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
      throw error
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
