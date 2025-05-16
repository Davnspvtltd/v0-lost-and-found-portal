"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"

type Item = {
  id: string
  user_id: string
  name: string
  phone: string
  product_name: string
  description: string
  place: string
  date: string
  type: string
  status: string
  image_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchUserItems()
  }, [user])

  const fetchUserItems = async () => {
    if (!user) return

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setItems(data || [])
    } catch (error) {
      console.error("Error fetching user items:", error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null

    return supabase.storage.from("items").getPublicUrl(path).data.publicUrl
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "lost":
        return <Badge variant="destructive">Lost</Badge>
      case "found":
        return <Badge variant="success">Found</Badge>
      case "completed":
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "emergency":
        return <Badge variant="destructive">Emergency</Badge>
      case "normal":
        return <Badge variant="secondary">Normal</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  if (!user) {
    return null
  }

  const lostItems = items.filter((item) => item.status === "lost")
  const foundItems = items.filter((item) => item.status === "found")
  const completedItems = items.filter((item) => item.status === "completed")

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">My Items</h1>
          <Link href="/dashboard">
            <Button>Report New Item</Button>
          </Link>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({items.length})</TabsTrigger>
            <TabsTrigger value="lost">Lost ({lostItems.length})</TabsTrigger>
            <TabsTrigger value="found">Found ({foundItems.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {renderItems(items)}
          </TabsContent>

          <TabsContent value="lost" className="mt-6">
            {renderItems(lostItems)}
          </TabsContent>

          <TabsContent value="found" className="mt-6">
            {renderItems(foundItems)}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {renderItems(completedItems)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  function renderItems(itemsToRender: Item[]) {
    if (loading) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (itemsToRender.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No items found</CardTitle>
            <CardDescription>You haven't reported any items in this category yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Report an Item</Button>
            </Link>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {itemsToRender.map((item) => (
          <Link href={`/items/${item.id}`} key={item.id}>
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <div className="aspect-video w-full bg-muted">
                {item.image_url ? (
                  <img
                    src={getImageUrl(item.image_url) || "/placeholder.svg"}
                    alt={item.product_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">No image</p>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{item.product_name}</h3>
                  <div className="flex gap-1">
                    {getStatusBadge(item.status)}
                    {getTypeBadge(item.type)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.place}</span>
                  <span>{format(new Date(item.date), "MMM d, yyyy")}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }
}
