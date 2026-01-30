// lib/utils/series-stats.ts
import { SeriesEpisode } from "@/lib/types/series";

export interface SeriesStatsResult {
  total_episodes: number;
  watched_episodes: number;
  total_seasons: number;
  watched_seasons: number;
  completion_percentage: number;
  average_rating?: number;
  total_watch_time: number;
  total_watch_hours: number;
  seasons: any[];
}

export async function calculateSeriesStats(
  supabase: any,
  seriesId: string,
  userId: string,
): Promise<SeriesStatsResult> {
  // Buscar todas as temporadas da série
  const { data: seasons } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("series_id", seriesId)
    .eq("user_id", userId)
    .order("season_number", { ascending: true });

  let totalEpisodes = 0;
  let watchedEpisodes = 0;
  let totalSeasons = seasons?.length || 0;
  let watchedSeasons = 0;
  let totalWatchTime = 0; // em minutos
  let allRatings: number[] = [];

  const seasonsWithDetails: any[] = [];

  if (seasons) {
    for (const season of seasons) {
      // Buscar episódios desta temporada
      const { data: episodes } = await supabase
        .from("series_episodes")
        .select("*")
        .eq("season_id", season.id)
        .order("episode_number", { ascending: true });

      const episodeCount = episodes?.length || 0;
      const watchedEpisodeCount =
        episodes?.filter((ep: SeriesEpisode) => ep.is_watched).length || 0;
      let seasonWatchTime = 0;
      const seasonRatings: number[] = [];

      if (episodes) {
        episodes.forEach((ep: SeriesEpisode) => {
          if (ep.duration) {
            seasonWatchTime += ep.duration;
          }
          if (ep.rating && ep.rating > 0) {
            seasonRatings.push(ep.rating);
          }
        });
      }

      // Atualizar estatísticas
      totalEpisodes += episodeCount;
      watchedEpisodes += watchedEpisodeCount;
      totalWatchTime += seasonWatchTime;

      if (episodeCount > 0 && watchedEpisodeCount === episodeCount) {
        watchedSeasons++;
      }

      allRatings.push(...seasonRatings);

      seasonsWithDetails.push({
        ...season,
        episodes,
        stats: {
          total_episodes: episodeCount,
          watched_episodes: watchedEpisodeCount,
          total_watch_time: seasonWatchTime,
          average_rating:
            seasonRatings.length > 0
              ? seasonRatings.reduce((a, b) => a + b, 0) / seasonRatings.length
              : undefined,
          completion_percentage:
            episodeCount > 0
              ? Math.round((watchedEpisodeCount / episodeCount) * 100)
              : 0,
        },
      });
    }
  }

  const averageRating =
    allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : undefined;

  const completionPercentage =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  return {
    total_episodes: totalEpisodes,
    watched_episodes: watchedEpisodes,
    total_seasons: totalSeasons,
    watched_seasons: watchedSeasons,
    completion_percentage: completionPercentage,
    average_rating: averageRating,
    total_watch_time: totalWatchTime,
    total_watch_hours: Math.round(totalWatchTime / 60),
    seasons: seasonsWithDetails,
  };
}
