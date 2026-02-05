// app/series/[id]/seasons/[seasonId]/episodes/bulk-add/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BulkAddEpisodes } from "@/components/series/forms/BulkAddEpisodes";

interface BulkAddEpisodesPageProps {
  params: Promise<{
    id: string;
    seasonId: string;
  }>;
}

export default async function BulkAddEpisodesPage({
  params,
}: BulkAddEpisodesPageProps) {
  const { id, seasonId } = await params;
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
    .select("id, name")
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
    redirect(`/series/${seriesId}/seasons`);
  }

  // Get existing episodes to determine next episode number
  const { data: existingEpisodes } = await supabase
    .from("series_episodes")
    .select("episode_number")
    .eq("season_id", seasonId)
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .order("episode_number", { ascending: true });

  // Calculate next episode number
  const nextEpisodeNumber = existingEpisodes?.length
    ? Math.max(...existingEpisodes.map((ep) => ep.episode_number)) + 1
    : 1;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <BulkAddEpisodes
            userId={user.id}
            seriesId={seriesId}
            seasonId={seasonId}
            seriesName={series.name || "Série"}
            seasonNumber={season.season_number}
            isSpecialSeason={season.is_special}
            nextEpisodeNumber={nextEpisodeNumber}
          />
        </div>
      </main>
    </div>
  );
}
