// app/series/episodes-to-watch/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Tv,
  Clock,
  Calendar,
  ChevronRight,
  Play,
  Plus,
  Eye,
  List,
} from "lucide-react";
import Link from "next/link";
import { MarkEpisodeButton } from "@/components/series/MarkEpisodeButton";

interface Episode {
  id: string;
  series_id: string;
  season_id: string;
  episode_number: number;
  name: string;
  duration: number;
  is_watched: boolean;
  release_date: string | null;
  rating: number | null;
  series_name: string;
  series_cover_image: string | null;
  season_number: number;
  season_name: string | null;
  series_status: string;
}

interface SeriesEpisodes {
  series_id: string;
  series_name: string;
  series_cover_image: string | null;
  series_status: string;
  episodes: Episode[];
  total_duration: number;
}

async function fetchPendingEpisodes(userId: string): Promise<SeriesEpisodes[]> {
  const supabase = await createClient();

  try {
    // Primeiro, buscar todas as séries do usuário
    const { data: series, error: seriesError } = await supabase
      .from("series")
      .select("id, name, cover_image, status")
      .eq("user_id", userId);

    if (seriesError) {
      console.error("Error fetching series:", seriesError);
      return [];
    }

    if (!series || series.length === 0) {
      return [];
    }

    const seriesEpisodes: SeriesEpisodes[] = [];

    // Para cada série, buscar temporadas
    for (const serie of series) {
      const { data: seasons, error: seasonsError } = await supabase
        .from("series_seasons")
        .select("id, season_number, name")
        .eq("series_id", serie.id);

      if (seasonsError || !seasons) continue;

      const serieEpisodes: Episode[] = [];

      // Para cada temporada, buscar episódios não assistidos
      for (const season of seasons) {
        const { data: episodes, error: episodesError } = await supabase
          .from("series_episodes")
          .select("*")
          .eq("season_id", season.id)
          .eq("is_watched", false)
          .order("episode_number", { ascending: true });

        if (episodesError || !episodes) continue;

        // Adicionar cada episódio à lista da série
        for (const episode of episodes) {
          const epData: Episode = {
            id: episode.id,
            series_id: serie.id,
            season_id: season.id,
            episode_number: episode.episode_number,
            name: episode.name || `Episódio ${episode.episode_number}`,
            duration: episode.duration || 0,
            is_watched: episode.is_watched,
            release_date: episode.release_date,
            rating: episode.rating,
            series_name: serie.name || "Série sem nome",
            series_cover_image: serie.cover_image,
            season_number: season.season_number,
            season_name: season.name || `Temporada ${season.season_number}`,
            series_status: serie.status || "in_progress",
          };
          serieEpisodes.push(epData);
        }
      }

      // Ordenar episódios por temporada e episódio
      const sortedEpisodes = serieEpisodes.sort((a, b) => {
        if (a.season_number !== b.season_number) {
          return a.season_number - b.season_number;
        }
        return a.episode_number - b.episode_number;
      });

      if (sortedEpisodes.length > 0) {
        const totalDuration = sortedEpisodes.reduce(
          (sum, ep) => sum + (ep.duration || 0),
          0,
        );

        seriesEpisodes.push({
          series_id: serie.id,
          series_name: serie.name || "Série sem nome",
          series_cover_image: serie.cover_image,
          series_status: serie.status || "in_progress",
          episodes: sortedEpisodes,
          total_duration: totalDuration,
        });
      }
    }

    // Ordenar séries pelo número de episódios pendentes
    return seriesEpisodes.sort((a, b) => b.episodes.length - a.episodes.length);
  } catch (error) {
    console.error("Error in fetchPendingEpisodes:", error);
    return [];
  }
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return "Duração desconhecida";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  }
  return `${mins}m`;
}

interface EpisodesToWatchPageProps {
  searchParams: Promise<{
    view?: "all" | "next";
  }>;
}

export default async function EpisodesToWatchPage({
  searchParams,
}: EpisodesToWatchPageProps) {
  const { view = "next" } = await searchParams;
  const supabase = await createClient();

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

  // Buscar episódios pendentes
  const seriesEpisodes = await fetchPendingEpisodes(user.id);

  // Preparar dados para diferentes visualizações
  let displayedData: SeriesEpisodes[] = [];
  let viewDescription = "";

  if (view === "next") {
    // Apenas o próximo episódio de cada série
    displayedData = seriesEpisodes
      .map((series) => ({
        ...series,
        episodes: series.episodes.length > 0 ? [series.episodes[0]] : [],
      }))
      .filter((series) => series.episodes.length > 0);
    viewDescription = "Mostrando apenas o próximo episódio de cada série";
  } else {
    // Todos os episódios
    displayedData = seriesEpisodes;
    viewDescription = "Mostrando todos os episódios pendentes";
  }

  // Calcular estatísticas baseadas nos dados exibidos
  const totalEpisodes = displayedData.reduce(
    (sum, series) => sum + series.episodes.length,
    0,
  );
  const totalDuration = displayedData.reduce(
    (sum, series) => sum + series.total_duration,
    0,
  );
  const totalHours = Math.round(totalDuration / 60);

  // Agrupar por status da série
  const episodesBySeriesStatus = {
    in_progress: displayedData.filter(
      (series) => series.series_status === "in_progress",
    ).length,
    completed: displayedData.filter(
      (series) => series.series_status === "completed",
    ).length,
    abandoned: displayedData.filter(
      (series) => series.series_status === "abandoned",
    ).length,
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <CheckCircle2 className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Episódios por Ver
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {viewDescription}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-lg border border-border/50">
                <Button
                  variant={view === "next" ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="h-9 px-3 rounded-none first:rounded-l-lg last:rounded-r-lg"
                >
                  <Link href="/series/episodes-to-watch?view=next">
                    <Eye className="h-4 w-4 mr-2" />
                    Próximo Episódio
                  </Link>
                </Button>
                <Button
                  variant={view === "all" ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="h-9 px-3 rounded-none first:rounded-l-lg last:rounded-r-lg"
                >
                  <Link href="/series/episodes-to-watch?view=all">
                    <List className="h-4 w-4 mr-2" />
                    Todos Episódios
                  </Link>
                </Button>
              </div>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/series">
                  <Tv className="h-4 w-4" />
                  Voltar às Séries
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-blue-500 hover:bg-blue-600">
                <Link href="/series/new">
                  <Plus className="h-4 w-4" />
                  Nova Série
                </Link>
              </Button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Tv className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-xs font-medium bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
                  {view === "next" ? "Séries" : "Total"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {view === "next"
                  ? "Séries com Próximo Episódio"
                  : "Episódios Pendentes"}
              </p>
              <p className="text-3xl font-bold mt-1">
                {view === "next" ? displayedData.length : totalEpisodes}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {view === "next"
                  ? `${totalEpisodes} episódios no total`
                  : `${displayedData.length} séries diferentes`}
              </p>
            </div>

            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Clock className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                  Tempo
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Tempo Total</p>
              <p className="text-3xl font-bold mt-1">
                {totalHours > 0 ? `${totalHours}h` : "-"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(totalDuration)} minutos
              </p>
            </div>

            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-medium bg-amber-500/10 text-amber-500 px-2 py-1 rounded">
                  Em Progresso
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Séries Ativas</p>
              <p className="text-3xl font-bold mt-1">
                {episodesBySeriesStatus.in_progress}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                com episódios pendentes
              </p>
            </div>

            <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <CheckCircle2 className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-xs font-medium bg-purple-500/10 text-purple-500 px-2 py-1 rounded">
                  Média
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {view === "next" ? "Por Série" : "Episódios/Série"}
              </p>
              <p className="text-3xl font-bold mt-1">
                {displayedData.length > 0
                  ? Math.round(totalEpisodes / displayedData.length)
                  : 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {view === "next" ? "próximo episódio" : "episódios/série"}
              </p>
            </div>
          </div>

          {/* Lista de Episódios */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {view === "next"
                    ? "Próximo Episódio de Cada Série"
                    : "Todos os Episódios Pendentes"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {view === "next"
                    ? `Clique no botão para marcar o próximo episódio como visto e avançar para o próximo`
                    : `Clique no botão para marcar qualquer episódio como visto`}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {totalEpisodes} episódios • {totalHours}h •{" "}
                {displayedData.length} séries
              </div>
            </div>

            {displayedData.length > 0 ? (
              displayedData.map((seriesData) => (
                <div
                  key={seriesData.series_id}
                  className="bg-card rounded-xl border overflow-hidden"
                >
                  {/* Cabeçalho da Série */}
                  <div className="p-4 border-b bg-muted/20">
                    <div className="flex items-center gap-4">
                      {seriesData.series_cover_image ? (
                        <img
                          src={seriesData.series_cover_image}
                          alt={seriesData.series_name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                          <Tv className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {seriesData.series_name}
                              </h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  seriesData.series_status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : seriesData.series_status === "abandoned"
                                      ? "bg-rose-500/10 text-rose-500"
                                      : "bg-blue-500/10 text-blue-500"
                                }`}
                              >
                                {seriesData.series_status === "completed"
                                  ? "Completa"
                                  : seriesData.series_status === "abandoned"
                                    ? "Abandonada"
                                    : "Em Progresso"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {seriesData.episodes.length} episódio
                              {seriesData.episodes.length !== 1 ? "s" : ""}{" "}
                              pendente
                              {seriesData.episodes.length !== 1 ? "s" : ""} •{" "}
                              {formatDuration(seriesData.total_duration)}
                              {view === "next" &&
                                seriesEpisodes.find(
                                  (s) => s.series_id === seriesData.series_id,
                                )?.episodes.length! > 1 &&
                                ` • +${seriesEpisodes.find((s) => s.series_id === seriesData.series_id)?.episodes.length! - 1} restantes`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="gap-2"
                            >
                              <Link href={`/series/${seriesData.series_id}`}>
                                Ver Série
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Episódios */}
                  <div className="divide-y">
                    {seriesData.episodes.map((episode) => (
                      <div
                        key={episode.id}
                        className="p-4 hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Botão Marcar como Visto */}
                          <MarkEpisodeButton
                            episodeId={episode.id}
                            seriesId={episode.series_id}
                            episodeNumber={episode.episode_number}
                            episodeName={episode.name}
                            seasonNumber={episode.season_number} // Adicione esta linha
                          />

                          {/* Informações do Episódio */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                S{episode.season_number}E
                                {episode.episode_number
                                  .toString()
                                  .padStart(2, "0")}
                              </span>
                              <h4 className="font-medium truncate group-hover:text-blue-500 transition-colors">
                                {episode.name}
                              </h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDuration(episode.duration)}
                              </div>
                              {episode.release_date && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(
                                    episode.release_date,
                                  ).toLocaleDateString("pt-PT")}
                                </div>
                              )}
                              {episode.rating && episode.rating > 0 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <span className="text-yellow-500">★</span>
                                  {episode.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              asChild
                            >
                              <Link href={`/series/${episode.series_id}`}>
                                <Play className="h-3 w-3" />
                                Ver
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum episódio pendente!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Você assistiu a todos os episódios das suas séries ou ainda
                  não adicionou nenhuma série.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="gap-2">
                    <Link href="/series">
                      <Tv className="h-4 w-4" />
                      Explorar Séries
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="gap-2 bg-blue-500 hover:bg-blue-600"
                  >
                    <Link href="/series/new">
                      <Plus className="h-4 w-4" />
                      Adicionar Série
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {displayedData.length > 0 && (
            <div className="text-center text-sm text-muted-foreground py-4 border-t">
              <p className="flex flex-col sm:flex-row items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Clique no botão para marcar um episódio como visto (abrirá um
                diálogo para configurar detalhes)
              </p>
              {view === "next" && (
                <p className="text-xs mt-2 text-muted-foreground/80">
                  Modo "Próximo Episódio": mostra apenas o primeiro episódio
                  pendente de cada série
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
