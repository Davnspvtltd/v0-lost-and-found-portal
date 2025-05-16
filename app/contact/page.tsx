import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, Phone } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="container py-12">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="mt-2 text-muted-foreground">
            Have questions about the Lost and Found Portal? Get in touch with us.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Visit Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p>Lost and Found Office</p>
                  <p className="text-sm text-muted-foreground">
                    Student Services Building, Room 101
                    <br />
                    Saveetha Engineering College
                    <br />
                    Chennai, Tamil Nadu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Call Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p>+91 98765 43210</p>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                Monday to Friday: 9:00 AM - 5:00 PM
                <br />
                Saturday: 10:00 AM - 2:00 PM
                <br />
                Sunday: Closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Email Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p>lostandfound@saveetha.ac.in</p>
              </div>
              <p className="text-sm text-muted-foreground pl-7">We typically respond within 24 hours on weekdays.</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                For any inquiries or assistance, please use the contact details above or visit us in person.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Lost and Found office is open during regular college hours. For urgent matters, please call the
                phone number listed above.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
