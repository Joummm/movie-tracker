import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ActorDetail } from "@/components/actors/actor-detail"

export default async function ActorDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Get actor details
  const { data: actor } = await supabase
    .from("actors")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!actor) {
    notFound()
  }

  // Get actor's content participations
  const { data: contentParticipations } = await supabase
    .from("content_actors")
    .select(`
      *,
      content:content_id (*, series(*)),
      actor_roles (*)
    `)
    .eq("actor_id", id)
    .is("content_id", null)
    .not("series_id", "is", null)

  // Get actor's series participations
  const { data: seriesParticipations } = await supabase
    .from("content_actors")
    .select(`
      *,
      series:series_id (*),
      actor_roles (*)
    `)
    .eq("actor_id", id)
    .not("series_id", "is", null)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <ActorDetail 
          actor={actor} 
          contentParticipations={contentParticipations || []}
          seriesParticipations={seriesParticipations || []}
        />
      </main>
    </div>
  )
}