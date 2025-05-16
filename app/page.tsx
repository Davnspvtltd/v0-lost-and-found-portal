import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Search, Upload, UserCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createClient()

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user profile if logged in
  let userProfile = null
  if (session?.user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    userProfile = data
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                {userProfile ? (
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Welcome to the Lost & Found Portal, {userProfile.email.split("@")[0]}!
                  </h1>
                ) : (
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Lost & Found Portal
                  </h1>
                )}
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Saveetha Engineering College's official platform to report lost items and find what you're looking
                  for.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-1.5">
                    Report an Item <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/items">
                  <Button size="lg" variant="outline" className="gap-1.5">
                    Browse Items <Search className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[450px] w-full overflow-hidden rounded-xl bg-muted">
                <img
                  src="/placeholder.svg?height=450&width=600"
                  alt="Lost and Found"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 lg:py-32 bg-muted/50 rounded-xl">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform makes it easy to report lost items and find what you're looking for.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Upload className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Report an Item</h3>
                <p className="text-muted-foreground">
                  Quickly report a lost or found item with all the necessary details.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Search className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Search Items</h3>
                <p className="text-muted-foreground">
                  Browse through all reported items or filter by category and date.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserCheck className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Get Connected</h3>
                <p className="text-muted-foreground">
                  Connect with the person who found your item or claim a found item.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
