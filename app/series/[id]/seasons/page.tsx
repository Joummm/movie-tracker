// app/series/[id]/seasons/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SeasonsList } from "@/components/series/SeasonsList";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowLeft,
  Tv,
  Eye,
  Clock,
  BarChart3,
  Trophy,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface SeasonsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeasonsPage({ params }: SeasonsPageProps) {
  const { id } = await params;
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
    .select(
      "id, name, cover_image, release_year, description, total_watch_time, average_rating, total_episodes, status, start_date, end_date",
    )
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    console.error("Error fetching series:", seriesError);
    redirect("/series");
  }

  // Get all seasons for this series - CORRIGIDO: removido relacionamento
  const { data: seasons, error: seasonsError } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .order("season_number", { ascending: true });

  // Get episodes separately para calcular tempo assistido corretamente
  const { data: allEpisodes } = await supabase
    .from("series_episodes")
    .select("id, season_id, duration, is_watched, rating")
    .eq("series_id", seriesId);

  if (seasonsError) {
    console.error("Error fetching seasons:", seasonsError);
  }

  // Usar array vazio como fallback
  const seasonsData = seasons || [];
  const episodesData = allEpisodes || [];

  // Calculate statistics CORRIGIDO - usando apenas episódios assistidos
  const totalSeasons = seasonsData.length;
  const totalEpisodes =
    seasonsData.reduce(
      (sum: number, season: any) => sum + (season.episode_count || 0),
      0,
    ) || 0;
  const watchedEpisodes =
    seasonsData.reduce(
      (sum: number, season: any) => sum + (season.watched_episode_count || 0),
      0,
    ) || 0;

  // Calcular tempo total assistido baseado nos episódios assistidos
  let totalWatchTimeMinutes = 0;
  let totalRating = 0;
  let ratedEpisodesCount = 0;

  // Mapear episódios por temporada para cálculos mais precisos
  const episodesBySeason: Record<string, any[]> = {};
  episodesData.forEach((episode: any) => {
    if (!episodesBySeason[episode.season_id]) {
      episodesBySeason[episode.season_id] = [];
    }
    episodesBySeason[episode.season_id].push(episode);

    if (episode.is_watched) {
      if (episode.duration) {
        totalWatchTimeMinutes += episode.duration;
      }
      if (episode.rating && episode.rating > 0) {
        totalRating += episode.rating;
        ratedEpisodesCount++;
      }
    }
  });

  // Adicionar episódios às temporadas
  const seasonsWithEpisodes = seasonsData.map((season: any) => ({
    ...season,
    series_episodes: episodesBySeason[season.id] || [],
  }));

  const completedSeasons =
    seasonsData.filter(
      (season: any) =>
        season.watched_episode_count === season.episode_count &&
        season.episode_count > 0,
    ).length || 0;

  const averageRating =
    ratedEpisodesCount > 0
      ? totalRating / ratedEpisodesCount
      : series.average_rating || 0;

  const progressPercentage =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  // Calcular estatísticas adicionais
  const regularSeasons = seasonsData.filter((s: any) => !s.is_special).length;
  const specialSeasons = seasonsData.filter((s: any) => s.is_special).length;

  const inProgressSeasons = seasonsData.filter(
    (season: any) =>
      season.watched_episode_count > 0 &&
      season.watched_episode_count < season.episode_count,
  ).length;

  const getDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const getWatchHours = (minutes: number) => {
    const hours = minutes / 60;
    return hours >= 1 ? Math.round(hours * 10) / 10 : hours.toFixed(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return "N/A";
    }
  };

  const getSeriesStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; bgColor: string }
    > = {
      in_progress: {
        label: "Em Andamento",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      completed: {
        label: "Completa",
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      abandoned: {
        label: "Abandonada",
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
    };
    return (
      statusMap[status] || {
        label: status,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      }
    );
  };

  const seriesStatus = getSeriesStatusBadge(series.status || "in_progress");

  // Encontrar temporada melhor avaliada
  const getBestRatedSeason = () => {
    if (seasonsData.length === 0) return "N/A";

    let bestSeason = seasonsData[0];
    seasonsData.forEach((season: any) => {
      if ((season.average_rating || 0) > (bestSeason.average_rating || 0)) {
        bestSeason = season;
      }
    });

    return bestSeason.average_rating ? `T${bestSeason.season_number}` : "N/A";
  };

  const bestRatedSeason = getBestRatedSeason();

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/5">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header com série info */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="h-10 w-10 rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-colors"
                >
                  <Link href={`/series/${seriesId}`}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Tv className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                          {series.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${seriesStatus.bgColor} ${seriesStatus.color}`}
                          >
                            {seriesStatus.label}
                          </span>
                          {series.release_year && (
                            <span className="text-sm text-muted-foreground">
                              • {series.release_year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                      {series.description ||
                        "Gerencie todas as temporadas da sua série"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  asChild
                  className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Link href={`/series/${seriesId}/seasons/new`}>
                    <Plus className="h-4 w-4" />
                    Nova Temporada
                  </Link>
                </Button>
                <Button variant="outline" asChild className="gap-2">
                  <Link href={`/series/${seriesId}/edit`}>Editar Série</Link>
                </Button>
              </div>
            </div>

            {/* Statistics Grid - Melhorado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Progress Card */}
              <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">
                    {progressPercentage}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Progresso Geral
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">
                    {watchedEpisodes}/{totalEpisodes}
                  </p>
                  <div className="text-xs text-muted-foreground">episódios</div>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{completedSeasons} temporadas completas</span>
                  <span>{inProgressSeasons} em andamento</span>
                </div>
              </div>

              {/* Watch Time Card */}
              <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Clock className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                    Assistido
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tempo Total Assistido
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">
                    {getWatchHours(totalWatchTimeMinutes)}h
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {getDurationText(totalWatchTimeMinutes)}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-1.5 rounded bg-emerald-500/10">
                      <Eye className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>
                      Baseado em {watchedEpisodes} episódios assistidos
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Card */}
              <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">
                    {completedSeasons}/{totalSeasons}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Temporadas Completas
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">
                    {totalSeasons > 0
                      ? Math.round((completedSeasons / totalSeasons) * 100)
                      : 0}
                    %
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {completedSeasons} de {totalSeasons}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalSeasons > 0 ? Math.round((completedSeasons / totalSeasons) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rating Card */}
              <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">
                    Média
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Avaliação Média
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">
                    {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {ratedEpisodesCount > 0
                      ? `${ratedEpisodesCount} avaliações`
                      : "Sem avaliações"}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-muted/50 rounded-full overflow-hidden">
                      {averageRating > 0 && (
                        <div
                          className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${(averageRating / 10) * 100}%` }}
                        />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      /10
                    </span>
                  </div>
                  {averageRating > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {averageRating >= 8
                        ? "Excelente"
                        : averageRating >= 6
                          ? "Bom"
                          : averageRating >= 4
                            ? "Regular"
                            : "Ruim"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-linear-to-r from-primary/5 to-blue-500/5 border border-primary/10 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Insights da Série</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">
                    Tempo médio por episódio:
                  </span>
                  <span className="font-medium">
                    {watchedEpisodes > 0
                      ? getDurationText(totalWatchTimeMinutes / watchedEpisodes)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-muted-foreground">
                    Taxa de conclusão:
                  </span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="text-muted-foreground">
                    Temporada mais avaliada:
                  </span>
                  <span className="font-medium">{bestRatedSeason}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seasons List Section */}
          <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/30 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold">Temporadas</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Gerencie e organize todas as temporadas da sua série
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {totalSeasons}
                  </span>{" "}
                  temporada{totalSeasons !== 1 ? "s" : ""}
                </div>
                <Button
                  size="sm"
                  asChild
                  className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Link href={`/series/${seriesId}/seasons/new`}>
                    <Plus className="h-3 w-3" />
                    Adicionar Temporada
                  </Link>
                </Button>
              </div>
            </div>

            {/* Seasons List - Passando temporadas com episódios */}
            <SeasonsList
              seasons={seasonsWithEpisodes}
              seriesId={seriesId}
              seriesName={series.name || "Série"}
              userId={user.id}
            />
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/10"
            >
              <Link href={`/series/${seriesId}`}>
                <ArrowLeft className="h-3 w-3" />
                Voltar para Série
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              <Link href={`/series/${seriesId}/seasons/new`}>
                <Plus className="h-3 w-3" />
                Adicionar Nova Temporada
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 border-border/50 hover:border-primary/50"
            >
              <Link href={`/series/${seriesId}/edit`}>Editar Série</Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              💡 <strong>Dica:</strong> Clique em qualquer temporada para ver
              seus episódios. Você pode marcar episódios como assistidos,
              adicionar avaliações e muito mais.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
