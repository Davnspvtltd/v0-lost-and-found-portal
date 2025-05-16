"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { AlertTriangle } from "lucide-react"
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

export default function EmergencyItemsPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmergencyItems()
  }, [])

  const fetchEmergencyItems = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("type", "emergency")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setItems(data || [])
    } catch (error) {
      console.error("Error fetching emergency items:", error)
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

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h1 className="text-3xl font-bold">Emergency Items</h1>
          </div>
          {user && (
            <Link href="/dashboard">
              <Button size="sm">Report Item</Button>
            </Link>
          )}
        </div>

        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium">
                Emergency items require immediate attention. If you have any information about these items, please
                contact the owner directly.
              </p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No emergency items found.</p>
            <p className="text-sm text-muted-foreground">Check back later or view all items.</p>
            <Link href="/items" className="mt-4">
              <Button variant="outline">View All Items</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link href={`/items/${item.id}`} key={item.id}>
                <Card className="overflow-hidden transition-all hover:shadow-md border-destructive/20">
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
                        <Badge variant="destructive">Emergency</Badge>
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
        )}
      </div>
    </div>
  )
}
