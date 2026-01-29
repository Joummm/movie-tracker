// app/series/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SeriesList } from "@/components/series/series-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SeriesStatus } from "@/lib/types/database";
import { Series as SeriesType } from "@/lib/types/database";

// Interface para os dados de temporada retornados pela query
interface SeriesSeasonData {
  id: string;
  season_number: number;
  name?: string;
  episode_count?: number;
  watched_episode_count?: number;
  is_special?: boolean;
}

// Interface para os dados de conteúdo retornados pela query
interface SeriesContentData {
  id: string;
  name?: string;
  cover_image?: string;
  rating?: number;
  watch_status?: string;
}

// Interface para a série com relações
interface SeriesWithRelations extends SeriesType {
  series_seasons?: SeriesSeasonData[];
  content?: SeriesContentData[];
}

export default async function SeriesPage() {
  const supabase = await createClient();

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

  // Get all series for this user with statistics
  const { data: series } = await supabase
    .from("series")
    .select(`
      *,
      series_seasons!series_seasons_series_id_fkey (
        id,
        season_number,
        name,
        episode_count,
        watched_episode_count,
        is_special
      ),
      content:content!content_series_id_fkey (
        id,
        name,
        cover_image,
        rating,
        watch_status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Calculate statistics for each series
  const seriesWithStats = series?.map((series: SeriesWithRelations) => {
    const seasons = series.series_seasons || [];
    const totalEpisodes = seasons.reduce(
      (sum: number, season: SeriesSeasonData) => sum + (season.episode_count || 0),
      0
    );
    const watchedEpisodes = seasons.reduce(
      (sum: number, season: SeriesSeasonData) => sum + (season.watched_episode_count || 0),
      0
    );
    const totalSeasons = seasons.length;
    const watchedSeasons = seasons.filter(
      (s: SeriesSeasonData) => s.watched_episode_count === s.episode_count
    ).length;
    
    // Calculate average rating from related content
    const ratings = (series.content || [])
      .filter((c: SeriesContentData) => c.rating != null)
      .map((c: SeriesContentData) => c.rating as number);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
      : undefined;

    return {
      ...series,
      stats: {
        total_episodes: totalEpisodes,
        watched_episodes: watchedEpisodes,
        total_seasons: totalSeasons,
        watched_seasons: watchedSeasons,
        completion_percentage: totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0,
        average_rating: averageRating
      }
    };
  });

  // Count series by status for filters
  const statusCounts = {
    all: series?.length || 0,
    in_progress: series?.filter((s: SeriesWithRelations) => s.status === 'in_progress').length || 0,
    completed: series?.filter((s: SeriesWithRelations) => s.status === 'completed').length || 0,
    abandoned: series?.filter((s: SeriesWithRelations) => s.status === 'abandoned').length || 0,
    planned: series?.filter((s: SeriesWithRelations) => s.status === 'planned').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Minhas Séries</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie todas as suas séries, temporadas e episódios
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href="/series/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Série
                </Link>
              </Button>
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total de Séries</p>
              <p className="text-2xl font-bold">{series?.length || 0}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Em Progresso</p>
              <p className="text-2xl font-bold">{statusCounts.in_progress}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Completadas</p>
              <p className="text-2xl font-bold">{statusCounts.completed}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Episódios</p>
              <p className="text-2xl font-bold">
                {seriesWithStats?.reduce((sum: number, s) => sum + s.stats.watched_episodes, 0) || 0}/
                {seriesWithStats?.reduce((sum: number, s) => sum + s.stats.total_episodes, 0) || 0}
              </p>
            </div>
          </div>

          {/* Series List */}
          <SeriesList 
            series={seriesWithStats || []} 
            statusCounts={statusCounts}
            user={user}
          />
        </div>
      </main>
    </div>
  );
}