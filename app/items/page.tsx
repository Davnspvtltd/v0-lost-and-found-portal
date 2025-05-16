"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isAfter, isBefore, isSameDay, parseISO } from "date-fns"
import { CalendarIcon, Filter, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

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

export default function ItemsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [statusFilter, typeFilter])

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

      const { data, error } = await query

      if (error) {
        throw error
      }

      setItems(data || [])
    } catch (error) {
      console.error("Error fetching items:", error)
      toast({
        title: "Error",
        description: "Failed to load items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    // Apply search filter
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      searchTerm === "" ||
      item.product_name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.place.toLowerCase().includes(searchLower)

    // Apply date range filter
    let matchesDateRange = true
    if (startDate && endDate) {
      const itemDate = parseISO(item.date)
      matchesDateRange =
        (isAfter(itemDate, startDate) || isSameDay(itemDate, startDate)) &&
        (isBefore(itemDate, endDate) || isSameDay(itemDate, endDate))
    } else if (startDate) {
      const itemDate = parseISO(item.date)
      matchesDateRange = isAfter(itemDate, startDate) || isSameDay(itemDate, startDate)
    } else if (endDate) {
      const itemDate = parseISO(item.date)
      matchesDateRange = isBefore(itemDate, endDate) || isSameDay(itemDate, endDate)
    }

    return matchesSearch && matchesDateRange
  })

  const resetFilters = () => {
    setStatusFilter("all")
    setTypeFilter("all")
    setStartDate(undefined)
    setEndDate(undefined)
    setSearchTerm("")
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

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">All Items</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters {showFilters ? "Hide" : "Show"}
            </Button>
            {user && (
              <Link href="/dashboard">
                <Button size="sm">Report Item</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items by name, description, or location..."
              className="pl-8 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => endDate !== undefined && isAfter(date, endDate)}
                          />
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
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) => startDate !== undefined && isBefore(date, startDate)}
                          />
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

        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} found
            </div>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-6">
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
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No items found.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || startDate || endDate) && (
                  <Button variant="outline" className="mt-4" onClick={resetFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
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
                            {item.type === "emergency" && getTypeBadge(item.type)}
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
          </TabsContent>

          <TabsContent value="list" className="mt-6">
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
                {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || startDate || endDate) && (
                  <Button variant="outline" className="mt-4" onClick={resetFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Link href={`/items/${item.id}`} key={item.id}>
                    <Card className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{item.product_name}</h3>
                            <div className="flex gap-1">
                              {getStatusBadge(item.status)}
                              {item.type === "emergency" && getTypeBadge(item.type)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Location: {item.place}</span>
                            <span>Date: {format(new Date(item.date), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
