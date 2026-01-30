// app/series/[id]/seasons/[seasonId]/page.tsx (corrigido - sem console.error vazio)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SeasonDetail } from "@/components/series/SeasonDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Edit, Clock, Star, Tv, Eye } from "lucide-react";
import Link from "next/link";

interface SeasonPageProps {
  params: Promise<{
    id: string;
    seasonId: string;
  }>;
}

export default async function SeasonDetailPage({ params }: SeasonPageProps) {
  const { id, seasonId } = await params;
  const supabase = await createClient();
  const seriesId = id;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get series info
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, name, cover_image")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    redirect("/series");
  }

  // Get season data
  const { data: season, error: seasonError } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("id", seasonId)
    .eq("user_id", user.id)
    .single();

  if (seasonError || !season) {
    redirect(`/series/${seriesId}/seasons`);
  }

  // Get episodes from series_episodes table
  const { data: episodes, error: episodesError } = await supabase
    .from("series_episodes")
    .select("*")
    .eq("season_id", seasonId)
    .eq("user_id", user.id)
    .order("episode_number", { ascending: true });

  let episodesData: any[] = [];

  if (episodesError) {
    // Fallback to content table
    try {
      const { data: contentEpisodes } = await supabase
        .from("content")
        .select("*")
        .eq("series_id", seriesId)
        .eq("season", season.season_number)
        .eq("user_id", user.id)
        .order("episode", { ascending: true });

      if (contentEpisodes) {
        episodesData = contentEpisodes.map((content: any) => ({
          id: content.id,
          episode_number: content.episode || 0,
          name: content.name,
          duration: content.duration,
          is_watched: content.watch_status === "completed",
          rating: content.rating,
          review: content.review,
          release_date: content.watched_date,
          created_at: content.created_at,
          would_recommend: content.would_recommend,
          would_rewatch: content.would_rewatch,
          rewatch_count: content.rewatch_count,
        }));
      }
    } catch (fallbackError) {
      // Usar array vazio se ambos falharem
      episodesData = [];
    }
  } else if (episodes) {
    episodesData = episodes.map((ep: any) => ({
      id: ep.id,
      episode_number: ep.episode_number,
      name: ep.name,
      duration: ep.duration,
      is_watched: ep.is_watched,
      rating: ep.rating,
      review: ep.review,
      release_date: ep.release_date,
      created_at: ep.created_at,
      would_recommend: ep.would_recommend,
      would_rewatch: ep.would_rewatch,
      rewatch_count: ep.rewatch_count,
    }));
  }

  // Calcular estatísticas atualizadas
  const totalEpisodes = episodesData.length;
  const watchedEpisodes = episodesData.filter((ep) => ep.is_watched).length;
  const totalWatchTime = episodesData.reduce(
    (sum, ep) => sum + (ep.duration || 0),
    0,
  );
  const ratedEpisodes = episodesData.filter((ep) => ep.rating && ep.rating > 0);
  const averageRating =
    ratedEpisodes.length > 0
      ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
        ratedEpisodes.length
      : 0;

  // Atualizar temporada com estatísticas corretas se necessário
  if (
    season.episode_count !== totalEpisodes ||
    season.watched_episode_count !== watchedEpisodes ||
    (season.average_rating || 0).toFixed(1) !== averageRating.toFixed(1) ||
    season.total_watch_time !== totalWatchTime
  ) {
    try {
      // Atualizar no banco de dados
      await supabase
        .from("series_seasons")
        .update({
          episode_count: totalEpisodes,
          watched_episode_count: watchedEpisodes,
          average_rating: averageRating > 0 ? averageRating : null,
          total_watch_time: totalWatchTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId);
    } catch (updateError) {
      // Continuar mesmo se a atualização falhar
    }
  }

  const seasonWithSeries = {
    ...season,
    episode_count: totalEpisodes,
    watched_episode_count: watchedEpisodes,
    average_rating: averageRating > 0 ? averageRating : null,
    total_watch_time: totalWatchTime,
    series: {
      id: seriesId,
      name: series.name,
      cover_image: series.cover_image,
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="h-10 w-10"
              >
                <Link href={`/series/${seriesId}/seasons`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/series/${seriesId}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {series.name}
                  </Link>
                  <span className="text-muted-foreground">/</span>
                  <Link
                    href={`/series/${seriesId}/seasons`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Temporadas
                  </Link>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold">
                    {season.is_special
                      ? "Especial"
                      : `Temporada ${season.season_number}`}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {season.is_special
                    ? "Especial"
                    : `Temporada ${season.season_number}`}
                  {season.name && `: ${season.name}`}
                </h1>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild className="gap-2">
                <Link
                  href={`/series/${seriesId}/seasons/${seasonId}/episodes/new`}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Episódio
                </Link>
              </Button>

              <Button variant="outline" asChild className="gap-2">
                <Link href={`/series/${seriesId}/seasons/${seasonId}/edit`}>
                  <Edit className="h-4 w-4" />
                  Editar Temporada
                </Link>
              </Button>

              <div className="hidden md:flex items-center gap-6 ml-auto">
                <div className="flex items-center gap-2">
                  <Tv className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{totalEpisodes} episódios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{watchedEpisodes} assistidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {Math.round(totalWatchTime / 60)}h total
                  </span>
                </div>
                {averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">
                      {averageRating.toFixed(1)}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Season Detail */}
          <SeasonDetail
            season={seasonWithSeries}
            seriesId={seriesId}
            episodes={episodesData}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
