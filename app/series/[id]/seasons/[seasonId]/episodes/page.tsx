// app/series/[id]/seasons/[seasonId]/episodes/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EpisodesList } from "@/components/series/episodes-list";

interface EpisodesPageProps {
  params: Promise<{
    id: string;
    seasonId: string;
  }>;
}

export default async function EpisodesPage({ params }: EpisodesPageProps) {
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
    .select(
      `
      *,
      series:series_id (
        id,
        name
      )
    `,
    )
    .eq("id", seasonId)
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!season) {
    redirect(`/series/${seriesId}`);
  }

  // Get all episodes for this season
  const { data: episodes } = await supabase
    .from("series_episodes")
    .select(
      `
      *,
      content:content_id (
        id,
        name,
        rating,
        watched_date
      )
    `,
    )
    .eq("season_id", seasonId)
    .eq("series_id", seriesId)
    .order("episode_number");

  // Calculate statistics
  const totalEpisodes = episodes?.length || 0;
  const watchedEpisodes = episodes?.filter((ep) => ep.is_watched).length || 0;
  const averageRating =
    episodes?.length > 0
      ? episodes.reduce((sum, ep) => sum + (ep.rating || 0), 0) /
        episodes.length
      : 0;

  const stats = {
    total_episodes: totalEpisodes,
    watched_episodes: watchedEpisodes,
    completion_percentage:
      totalEpisodes > 0
        ? Math.round((watchedEpisodes / totalEpisodes) * 100)
        : 0,
    average_rating: averageRating,
    total_watch_time: season.total_watch_time || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <EpisodesList
            seriesId={seriesId}
            seriesName={series.name || "Série"}
            seasonId={seasonId}
            season={season}
            episodes={episodes || []}
            stats={stats}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
