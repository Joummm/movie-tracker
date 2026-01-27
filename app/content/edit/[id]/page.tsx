import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EditContentForm } from "@/components/content/edit-content-form"

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get the content item
  const { data: content } = await supabase.from("content").select("*, series(*)").eq("id", id).single()

  if (!content) {
    notFound()
  }

  // Check if user owns this content
  if (content.user_id !== user.id) {
    redirect("/content")
  }

  // Get user's series if content is an episode
  const { data: series } = await supabase.from("series").select("*").eq("user_id", user.id).order("name")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <EditContentForm content={content} userSeries={series || []} />
      </main>
    </div>
  )
}
