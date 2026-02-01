// app/series/[id]/seasons/[seasonId]/episodes/[episodeId]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EpisodeDetail } from "@/components/series/EpisodeDetail";

interface EpisodePageProps {
  params: Promise<{
    id: string;
    seasonId: string;
    episodeId: string;
  }>;
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { id, seasonId, episodeId } = await params;
  const supabase = await createClient();
  const seriesId = id;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get series information
  const { data: series } = await supabase
    .from("series")
    .select("id, name, cover_image")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!series) {
    redirect("/series");
  }

  // Get season information
  const { data: season } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("id", seasonId)
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!season) {
    redirect(`/series/${seriesId}/seasons/${seasonId}`);
  }

  // Get episode information
  const { data: episode } = await supabase
    .from("series_episodes")
    .select("*")
    .eq("id", episodeId)
    .eq("season_id", seasonId)
    .single();

  if (!episode) {
    redirect(`/series/${seriesId}/seasons/${seasonId}`);
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <EpisodeDetail
            episode={episode}
            series={series}
            season={season}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
