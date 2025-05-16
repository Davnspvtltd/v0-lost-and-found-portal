"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays } from "date-fns"
import { CalendarIcon, Filter, Search, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
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

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [bulkDeleteType, setBulkDeleteType] = useState<string>("both")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push("/")
      return
    }

    fetchItems()
  }, [user, isAdmin, statusFilter, typeFilter, startDate, endDate])

  const fetchItems = async () => {
    setLoading(true)

    try {
      let query = supabase.from("items").select("*").order("created_at", { ascending: false })

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter)
      }

      if (startDate && endDate) {
        const startDateString = format(startDate, "yyyy-MM-dd")
        const endDateString = format(endDate, "yyyy-MM-dd")
        query = query.gte("date", `${startDateString}T00:00:00`).lte("date", `${endDateString}T23:59:59`)
      } else if (startDate) {
        const startDateString = format(startDate, "yyyy-MM-dd")
        query = query.gte("date", `${startDateString}T00:00:00`)
      } else if (endDate) {
        const endDateString = format(endDate, "yyyy-MM-dd")
        query = query.lte("date", `${endDateString}T23:59:59`)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setItems(data || [])
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.product_name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.place.toLowerCase().includes(searchLower) ||
      item.name.toLowerCase().includes(searchLower) ||
      item.phone.toLowerCase().includes(searchLower)
    )
  })

  const resetFilters = () => {
    setStatusFilter("all")
    setTypeFilter("all")
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const deleteItem = async (itemId: string) => {
    try {
      // Get the item to check if it has an image
      const { data: item } = await supabase.from("items").select("image_url").eq("id", itemId).single()

      // If there's an image, delete it from storage first
      if (item?.image_url) {
        await supabase.storage.from("items").remove([item.image_url])
      }

      // Delete the item from the database
      const { error } = await supabase.from("items").delete().eq("id", itemId)

      if (error) {
        throw error
      }

      // Update the local state
      setItems(items.filter((item) => item.id !== itemId))

      toast({
        title: "Item deleted",
        description: "The item has been permanently deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const bulkDeleteItems = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date range required",
        description: "Please select both start and end dates for bulk deletion.",
        variant: "destructive",
      })
      return
    }

    setDeleting(true)

    try {
      const startDateString = format(startDate, "yyyy-MM-dd")
      const endDateString = format(endDate, "yyyy-MM-dd")

      // First, get all items that match the criteria
      let query = supabase
        .from("items")
        .select("id, image_url")
        .gte("date", `${startDateString}T00:00:00`)
        .lte("date", `${endDateString}T23:59:59`)

      if (bulkDeleteType !== "both") {
        query = query.eq("type", bulkDeleteType)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        toast({
          title: "No items found",
          description: "No items match the selected criteria for deletion.",
        })
        return
      }

      // Delete images from storage
      const imagesToDelete = data.filter((item) => item.image_url).map((item) => item.image_url as string)

      if (imagesToDelete.length > 0) {
        await supabase.storage.from("items").remove(imagesToDelete)
      }

      // Delete items from database
      const itemIds = data.map((item) => item.id)
      const { error: deleteError } = await supabase.from("items").delete().in("id", itemIds)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      setItems(items.filter((item) => !itemIds.includes(item.id)))

      toast({
        title: "Bulk deletion successful",
        description: `${data.length} items have been permanently deleted.`,
      })

      // Reset date filters
      setStartDate(undefined)
      setEndDate(undefined)
    } catch (error: any) {
      toast({
        title: "Error during bulk deletion",
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

  // Redirect if not admin
  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">Manage Items</TabsTrigger>
            <TabsTrigger value="bulk-delete">Bulk Delete</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-6 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {showFilters && (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="found">Found</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !startDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                          </Popover>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !endDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button variant="ghost" onClick={resetFilters} className="w-full">
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-2">
                        <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No items found.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {item.image_url && (
                        <div className="w-full md:w-48 h-32 bg-muted">
                          <img
                            src={getImageUrl(item.image_url) || "/placeholder.svg"}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{item.product_name}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <div className="flex gap-1">
                            {getStatusBadge(item.status)}
                            {getTypeBadge(item.type)}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Reported by: </span>
                            <span>
                              {item.name} ({item.phone})
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Date: </span>
                            <span>{format(new Date(item.date), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <Link href={`/items/${item.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button variant="destructive" size="sm" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bulk-delete" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Delete Items</CardTitle>
                <CardDescription>
                  Delete multiple items based on date range and type. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <Select value={bulkDeleteType} onValueChange={setBulkDeleteType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Normal and Emergency</SelectItem>
                      <SelectItem value="normal">Normal Items Only</SelectItem>
                      <SelectItem value="emergency">Emergency Items Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quick Select</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        setStartDate(subDays(today, 30))
                        setEndDate(today)
                      }}
                    >
                      Last 30 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        setStartDate(subDays(today, 60))
                        setEndDate(today)
                      }}
                    >
                      Last 60 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        setStartDate(subDays(today, 90))
                        setEndDate(today)
                      }}
                    >
                      Last 90 Days
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  onClick={bulkDeleteItems}
                  disabled={deleting || !startDate || !endDate}
                  className="w-full"
                >
                  {deleting ? "Deleting..." : "Delete Items"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
