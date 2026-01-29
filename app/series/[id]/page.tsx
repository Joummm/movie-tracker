// app/series/[id]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SeriesHeader } from "@/components/series/series-header";
import { SeriesTabs } from "@/components/series/series-tabs";

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const { id } = await params;
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

  // Get series with all relationships
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select(
      `
      *,
      series_seasons!series_seasons_series_id_fkey (
        id,
        season_number,
        name,
        episode_count,
        watched_episode_count,
        is_special,
        poster_vertical,
        release_year,
        average_rating
      ),
      series_cast!series_cast_series_id_fkey (
        id,
        actor_id,
        character_name,
        is_main_cast,
        episode_count,
        season_range,
        actors!series_cast_actor_id_fkey (
          id,
          name,
          photo_url,
          role
        )
      ),
      content:content!content_series_id_fkey (
        id,
        name,
        type,
        rating,
        watched_date,
        watch_status
      )
    `,
    )
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    console.error("Error fetching series:", seriesError);
    redirect("/series");
  }

  // Type safety for the data
  type SeasonType = {
    episode_count: number;
    watched_episode_count: number;
  };

  type ContentType = {
    rating: number | null;
  };

  // Calculate statistics
  const seasons = series.series_seasons || [];
  const totalEpisodes = seasons.reduce(
    (sum: number, season: SeasonType) => sum + (season.episode_count || 0),
    0,
  );
  const watchedEpisodes = seasons.reduce(
    (sum: number, season: SeasonType) =>
      sum + (season.watched_episode_count || 0),
    0,
  );
  const totalSeasons = seasons.length;
  const watchedSeasons = seasons.filter(
    (s: SeasonType) => s.watched_episode_count === s.episode_count,
  ).length;

  // Get average rating from related content
  const ratings = (series.content || [])
    .filter((c: ContentType) => c.rating != null)
    .map((c: ContentType) => c.rating as number);
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : undefined;

  const seriesWithStats = {
    ...series,
    stats: {
      total_episodes: totalEpisodes,
      watched_episodes: watchedEpisodes,
      total_seasons: totalSeasons,
      watched_seasons: watchedSeasons,
      completion_percentage:
        totalEpisodes > 0
          ? Math.round((watchedEpisodes / totalEpisodes) * 100)
          : 0,
      average_rating: averageRating,
      total_watch_time: series.total_watch_time || 0,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SeriesHeader series={seriesWithStats} user={user} />

          <div className="mt-8">
            <SeriesTabs
              seriesId={seriesId}
              seriesData={seriesWithStats}
              seasons={seasons}
              cast={series.series_cast || []}
              stats={seriesWithStats.stats}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
