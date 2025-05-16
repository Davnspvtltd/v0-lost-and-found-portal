"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { AlertTriangle, ArrowLeft, Calendar, MapPin, Phone, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const itemId = params.id as string

  useEffect(() => {
    fetchItem()
  }, [itemId])

  const fetchItem = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase.from("items").select("*").eq("id", itemId).single()

      if (error) {
        throw error
      }

      setItem(data)
    } catch (error) {
      console.error("Error fetching item:", error)
      toast({
        title: "Error",
        description: "Could not load the item. It may have been deleted.",
        variant: "destructive",
      })
      router.push("/items")
    } finally {
      setLoading(false)
    }
  }

  const updateItemStatus = async (newStatus: string) => {
    if (!item) return

    setUpdating(true)

    try {
      const { error } = await supabase.from("items").update({ status: newStatus }).eq("id", item.id)

      if (error) {
        throw error
      }

      setItem({ ...item, status: newStatus })

      toast({
        title: "Status updated",
        description: `Item status has been updated to ${newStatus}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const deleteItem = async () => {
    if (!item) return

    setDeleting(true)

    try {
      // If there's an image, delete it from storage first
      if (item.image_url) {
        const { error: storageError } = await supabase.storage.from("items").remove([item.image_url])

        if (storageError) {
          console.error("Error deleting image:", storageError)
        }
      }

      // Delete the item from the database
      const { error } = await supabase.from("items").delete().eq("id", item.id)

      if (error) {
        throw error
      }

      toast({
        title: "Item deleted",
        description: "The item has been permanently deleted.",
      })

      router.push("/items")
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null

    return supabase.storage.from("items").getPublicUrl(path).data.publicUrl
  }

  const canUpdateStatus = user && (isAdmin || (item && user.id === item.user_id))
  const canDelete = user && (isAdmin || (item && user.id === item.user_id))

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex flex-col gap-6">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <Card>
            <CardHeader>
              <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-40 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Item not found.</p>
          <Link href="/items" className="mt-4">
            <Button variant="outline">Back to Items</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/items">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">Back to items</span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl">{item.product_name}</CardTitle>
                <CardDescription>Reported on {format(new Date(item.created_at), "MMMM d, yyyy")}</CardDescription>
              </div>
              <div className="flex gap-2">
                {item.status === "lost" && <Badge variant="destructive">Lost</Badge>}
                {item.status === "found" && <Badge variant="success">Found</Badge>}
                {item.status === "completed" && <Badge variant="outline">Completed</Badge>}
                {item.type === "emergency" && (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Emergency
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {item.image_url && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={getImageUrl(item.image_url) || "/placeholder.svg"}
                  alt={item.product_name}
                  className="w-full max-h-96 object-contain"
                />
              </div>
            )}

            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Details</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location: </span>
                    <span>{item.place}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date: </span>
                    <span>{format(new Date(item.date), "MMMM d, yyyy")}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Contact Information</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name: </span>
                    <span>{item.name}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone: </span>
                    <span>{item.phone}</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>

          {(canUpdateStatus || canDelete) && (
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              {canUpdateStatus && item.status !== "completed" && (
                <Button onClick={() => updateItemStatus("completed")} disabled={updating} className="w-full sm:w-auto">
                  {updating ? "Updating..." : "Mark as Completed"}
                </Button>
              )}

              {canUpdateStatus && item.status === "lost" && (
                <Button
                  variant="outline"
                  onClick={() => updateItemStatus("found")}
                  disabled={updating}
                  className="w-full sm:w-auto"
                >
                  {updating ? "Updating..." : "Mark as Found"}
                </Button>
              )}

              {canUpdateStatus && item.status === "found" && (
                <Button
                  variant="outline"
                  onClick={() => updateItemStatus("lost")}
                  disabled={updating}
                  className="w-full sm:w-auto"
                >
                  {updating ? "Updating..." : "Mark as Lost"}
                </Button>
              )}

              {canDelete && (
                <Button variant="destructive" onClick={deleteItem} disabled={deleting} className="w-full sm:w-auto">
                  {deleting ? "Deleting..." : "Delete Item"}
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
