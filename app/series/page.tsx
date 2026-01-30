// app/series/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SeriesList } from "@/components/series/SeriesList";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Tv,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Film,
} from "lucide-react";
import Link from "next/link";
import { SeriesWithStats, StatusCounts } from "@/lib/types/series";

// Componente Badge
function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: any) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";

  type VariantType = "default" | "secondary" | "outline";
  const variantStyle = variant as VariantType;

  const variants: Record<VariantType, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border",
  };

  return (
    <span
      className={`${baseStyles} ${variants[variantStyle] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

async function fetchSeriesData(userId: string) {
  const supabase = await createClient();

  // Buscar séries
  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const seriesWithDetails: SeriesWithStats[] = [];

  if (series) {
    for (const serie of series) {
      // Buscar temporadas desta série
      const { data: seasons } = await supabase
        .from("series_seasons")
        .select("*")
        .eq("series_id", serie.id)
        .order("season_number", { ascending: true });

      let totalEpisodes = 0;
      let watchedEpisodes = 0;
      let totalSeasons = 0;
      let watchedSeasons = 0;
      let allRatings: number[] = [];
      let totalWatchTime = 0;

      const seasonsData = [];

      if (seasons) {
        totalSeasons = seasons.length;

        for (const season of seasons) {
          // Buscar episódios desta temporada
          const { data: episodes } = await supabase
            .from("series_episodes")
            .select("*")
            .eq("season_id", season.id)
            .order("episode_number", { ascending: true });

          const episodeCount = episodes?.length || 0;

          // Calcular episódios assistidos
          const watchedEpisodeCount =
            episodes?.filter((ep) => ep.is_watched).length || 0;

          // Calcular tempo de watch e coletar avaliações
          let seasonWatchTime = 0;
          const seasonRatings: number[] = [];

          if (episodes) {
            episodes.forEach((ep) => {
              if (ep.duration) {
                seasonWatchTime += ep.duration;
              }
              if (ep.rating && ep.rating > 0) {
                seasonRatings.push(ep.rating);
              }
            });
          }

          // Atualizar estatísticas gerais
          totalEpisodes += episodeCount;
          watchedEpisodes += watchedEpisodeCount;
          totalWatchTime += seasonWatchTime;

          // Verificar se a temporada está completa
          if (episodeCount > 0 && watchedEpisodeCount === episodeCount) {
            watchedSeasons++;
          }

          // Coletar todas as avaliações para a série
          allRatings.push(...seasonRatings);

          // Adicionar dados da temporada
          seasonsData.push({
            id: season.id,
            season_number: season.season_number,
            name: season.name,
            episode_count: episodeCount,
            watched_episode_count: watchedEpisodeCount,
            is_special: season.is_special || false,
            total_watch_time: seasonWatchTime,
            episodes:
              episodes?.map((ep) => ({
                id: ep.id,
                episode_number: ep.episode_number,
                name: ep.name,
                duration: ep.duration,
                is_watched: ep.is_watched,
                rating: ep.rating,
              })) || [],
          });
        }
      }

      // Calcular média de avaliações da série
      const averageRating =
        allRatings.length > 0
          ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
          : undefined;

      // Calcular porcentagem de conclusão
      const completionPercentage =
        totalEpisodes > 0
          ? Math.round((watchedEpisodes / totalEpisodes) * 100)
          : 0;

      // Criar objeto da série com estatísticas
      seriesWithDetails.push({
        ...serie,
        seasons: seasonsData,
        stats: {
          total_episodes: totalEpisodes,
          watched_episodes: watchedEpisodes,
          total_seasons: totalSeasons,
          watched_seasons: watchedSeasons,
          completion_percentage: completionPercentage,
          average_rating: averageRating,
          total_watch_hours: Math.round(totalWatchTime / 60),
        },
      });
    }
  }

  return seriesWithDetails;
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

  // Buscar dados das séries
  const seriesWithDetails = await fetchSeriesData(user.id);

  // Calcular estatísticas gerais
  const totalSeries = seriesWithDetails.length;
  const totalEpisodes = seriesWithDetails.reduce(
    (sum, s) => sum + s.stats.total_episodes,
    0,
  );
  const watchedEpisodes = seriesWithDetails.reduce(
    (sum, s) => sum + s.stats.watched_episodes,
    0,
  );
  const totalWatchHours = seriesWithDetails.reduce(
    (sum, s) => sum + s.stats.total_watch_hours,
    0,
  );
  const averageCompletion =
    totalSeries > 0
      ? Math.round(
          seriesWithDetails.reduce(
            (sum, s) => sum + s.stats.completion_percentage,
            0,
          ) / totalSeries,
        )
      : 0;

  // Calcular média das avaliações das séries
  const allSeriesRatings = seriesWithDetails
    .map((s) => s.stats.average_rating || 0)
    .filter((rating) => rating > 0);

  const averageSeriesRating =
    allSeriesRatings.length > 0
      ? allSeriesRatings.reduce((a, b) => a + b, 0) / allSeriesRatings.length
      : 0;

  // Contar séries por status
  const statusCounts: StatusCounts = {
    all: totalSeries,
    in_progress: seriesWithDetails.filter((s) => s.status === "in_progress")
      .length,
    completed: seriesWithDetails.filter((s) => s.status === "completed").length,
    abandoned: seriesWithDetails.filter((s) => s.status === "abandoned").length,
    planned: seriesWithDetails.filter((s) => s.status === "planned").length,
  };

  // Encontrar séries mais assistidas e melhor avaliadas
  const mostWatchedSeries = [...seriesWithDetails]
    .sort((a, b) => b.stats.watched_episodes - a.stats.watched_episodes)
    .slice(0, 3);

  const topRatedSeries = [...seriesWithDetails]
    .filter((s) => s.stats.average_rating && s.stats.average_rating > 0)
    .sort(
      (a, b) => (b.stats.average_rating || 0) - (a.stats.average_rating || 0),
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Tv className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Minhas Séries
                </h1>
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Acompanhe todas as suas séries e veja seu progresso
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              >
                <Link href="/series/new">
                  <Plus className="h-4 w-4" />
                  Nova Série
                </Link>
              </Button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Film className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-xs">
                  Total
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Séries</p>
              <p className="text-3xl font-bold mt-1">{totalSeries}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary to-blue-500 rounded-full"
                    style={{ width: `${totalSeries > 0 ? 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {statusCounts.completed} completas
                </span>
              </div>
            </div>

            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">
                  Progresso
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Episódios</p>
              <p className="text-3xl font-bold mt-1">
                {watchedEpisodes}/{totalEpisodes}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{
                      width: `${totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {totalEpisodes > 0
                    ? Math.round((watchedEpisodes / totalEpisodes) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Clock className="h-5 w-5 text-emerald-500" />
                <Badge variant="outline" className="text-xs">
                  Tempo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Horas Assistidas</p>
              <p className="text-3xl font-bold mt-1">{totalWatchHours}h</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-green-500 rounded-full"
                    style={{
                      width: `${Math.min((totalWatchHours / 100) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {totalSeries > 0
                    ? Math.round(totalWatchHours / totalSeries)
                    : 0}
                  h/série
                </span>
              </div>
            </div>

            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                <Badge variant="outline" className="text-xs">
                  Progresso Médio
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Conclusão</p>
              <p className="text-3xl font-bold mt-1">{averageCompletion}%</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${averageCompletion}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {statusCounts.in_progress} em progresso
                </span>
              </div>
            </div>

            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <Badge variant="outline" className="text-xs">
                  Média
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Avaliação Média</p>
              <p className="text-3xl font-bold mt-1">
                {averageSeriesRating.toFixed(1)}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-yellow-500 to-orange-500 rounded-full"
                    style={{ width: `${(averageSeriesRating / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {allSeriesRatings.length} séries avaliadas
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Distribution */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Distribuição por Status
              </h3>
              <div className="space-y-4">
                {[
                  {
                    status: "Em Progresso",
                    count: statusCounts.in_progress,
                    color: "bg-blue-500",
                  },
                  {
                    status: "Completadas",
                    count: statusCounts.completed,
                    color: "bg-emerald-500",
                  },
                  // { status: "Planeadas", count: statusCounts.planned, color: "bg-purple-500" },
                  {
                    status: "Abandonadas",
                    count: statusCounts.abandoned,
                    color: "bg-rose-500",
                  },
                ].map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.status}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{
                          width: `${totalSeries > 0 ? (item.count / totalSeries) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Watched */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Mais Assistidas
              </h3>
              <div className="space-y-4">
                {mostWatchedSeries.length > 0 ? (
                  mostWatchedSeries.map((series) => (
                    <div
                      key={series.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {series.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={series.cover_image}
                          alt={series.name || "Série sem nome"}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Tv className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {series.name || "Série sem nome"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {series.stats.watched_episodes} episódios
                        </p>
                      </div>
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {series.stats.completion_percentage}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma série assistida ainda
                  </p>
                )}
              </div>
            </div>

            {/* Top Rated */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Melhor Avaliadas
              </h3>
              <div className="space-y-4">
                {topRatedSeries.length > 0 ? (
                  topRatedSeries.map((series) => (
                    <div
                      key={series.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {series.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={series.cover_image}
                          alt={series.name || "Série sem nome"}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Star className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {series.name || "Série sem nome"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium">
                              {series.stats.average_rating?.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            • {series.stats.watched_episodes} eps
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Sem avaliações ainda
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Series List Component */}
          <SeriesList
            series={seriesWithDetails}
            statusCounts={statusCounts}
            user={user}
          />
        </div>
      </main>
    </div>
  );
}
