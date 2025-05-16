"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [place, setPlace] = useState("")
  const [date, setDate] = useState<Date>()
  const [type, setType] = useState("normal")
  const [status, setStatus] = useState("lost")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  if (!user) {
    router.push("/auth/login")
    return null
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) {
      toast({
        title: "Date is required",
        description: "Please select a date for the item.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let imagePath = null

      // Upload image if provided
      if (image) {
        const fileExt = image.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `items/${fileName}`

        const { error: uploadError, data } = await supabase.storage.from("items").upload(filePath, image)

        if (uploadError) {
          throw uploadError
        }

        imagePath = filePath
      }

      // Create item in database
      const { error } = await supabase.from("items").insert({
        user_id: user.id,
        name,
        phone,
        product_name: productName,
        description,
        place,
        date: date.toISOString(),
        type,
        status,
        image_url: imagePath,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Item reported successfully",
        description: "Your item has been reported and is now visible to others.",
      })

      // Reset form
      setName("")
      setPhone("")
      setProductName("")
      setDescription("")
      setPlace("")
      setDate(undefined)
      setType("normal")
      setStatus("lost")
      setImage(null)
      setImagePreview(null)

      // Redirect to items page
      router.push("/items")
    } catch (error: any) {
      toast({
        title: "Error reporting item",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Report an Item</CardTitle>
          <CardDescription>Fill out the form below to report a lost or found item.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">Item Name</Label>
              <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="place">Place</Label>
                <Input
                  id="place"
                  placeholder="Where was it lost/found?"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup
                defaultValue="normal"
                value={type}
                onValueChange={setType}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emergency" id="emergency" />
                  <Label htmlFor="emergency">Emergency</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="found">Found</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Item Image</Label>
              <div className="flex flex-col items-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="image" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload an image</span>
                    </div>
                    <Input id="image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </Label>
                </div>

                {imagePreview && (
                  <div className="relative w-full max-w-sm overflow-hidden rounded-lg border">
                    <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="h-48 w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        setImage(null)
                        setImagePreview(null)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
