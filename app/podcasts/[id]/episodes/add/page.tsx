import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AddPodcastEpisode } from "@/components/podcasts/add-podcast-episode"

export default async function AddPodcastEpisodePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
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

  // Verify podcast exists and belongs to user
  const { data: podcast } = await supabase
    .from("podcasts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!podcast) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <AddPodcastEpisode podcastId={id} userId={user.id} />
      </main>
    </div>
  )
}