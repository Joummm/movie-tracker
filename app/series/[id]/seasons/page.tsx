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
  Calendar,
  Eye,
  Clock,
  BarChart3,
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
      "id, name, cover_image, release_year, description, total_watch_time",
    )
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    console.error("Error fetching series:", seriesError);
    redirect("/series");
  }

  // Get all seasons for this series
  const { data: seasons, error: seasonsError } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .order("season_number", { ascending: true });

  console.log("Seasons data:", seasons);
  console.log("Seasons error:", seasonsError);

  if (seasonsError) {
    console.error("Error fetching seasons:", seasonsError);
  }

  // Usar array vazio como fallback
  const seasonsData = seasons || [];

  // Calculate statistics
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
  const completedSeasons =
    seasonsData.filter(
      (season: any) => season.watched_episode_count === season.episode_count,
    ).length || 0;

  const totalWatchTime =
    seasonsData.reduce(
      (sum: number, season: any) => sum + (season.total_watch_time || 0),
      0,
    ) || 0;

  // Calcular média de avaliação
  const seasonsWithRatings = seasonsData.filter(
    (season: any) => season.average_rating && season.average_rating > 0,
  );
  const averageRating =
    seasonsWithRatings.length > 0
      ? seasonsWithRatings.reduce(
          (sum: number, season: any) => sum + season.average_rating,
          0,
        ) / seasonsWithRatings.length
      : 0;

  const progressPercentage =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  const getDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const getWatchHours = (minutes: number) => {
    return Math.round(minutes / 60);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/10">
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
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Tv className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">
                      {series.name}
                    </h1>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Gerencie todas as temporadas da sua série
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  asChild
                  className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Link href={`/series/${seriesId}/seasons/new`}>
                    <Plus className="h-4 w-4" />
                    Nova Temporada
                  </Link>
                </Button>
              </div>
            </div>

            {/* Informações rápidas da série */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/30 p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Tv className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Série</p>
                    <p className="font-semibold">{series.name}</p>
                  </div>
                </div>
              </div>

              {series.release_year && (
                <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/30 p-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Ano de Lançamento
                      </p>
                      <p className="font-semibold">{series.release_year}</p>
                    </div>
                  </div>
                </div>
              )}

              {series.total_watch_time && series.total_watch_time > 0 && (
                <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/30 p-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Clock className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tempo Total da Série
                      </p>
                      <p className="font-semibold">
                        {getWatchHours(series.total_watch_time)}h
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Tv className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">
                    Total
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Temporadas</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">{totalSeasons}</p>
                  <div className="text-xs text-muted-foreground">
                    {completedSeasons} completas
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Eye className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                    Progresso
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Episódios</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">
                    {watchedEpisodes}/{totalEpisodes}
                  </p>
                  <div className="text-xs font-semibold text-emerald-600">
                    {progressPercentage}%
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">
                    Tempo
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tempo Assistido
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">
                    {getWatchHours(totalWatchTime)}h
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {getDurationText(totalWatchTime)}
                  </div>
                </div>
              </div>

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
                  <div className="flex items-center gap-1">
                    {averageRating > 0 && (
                      <>
                        <div className="h-1.5 w-16 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{ width: `${(averageRating / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          /10
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seasons List Section */}
          <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-border/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Temporadas</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Gerencie e organize todas as temporadas da sua série
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {totalSeasons} temporada{totalSeasons !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Seasons List */}
            <SeasonsList
              seasons={seasonsData}
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
              className="gap-2 border-border/50 hover:border-primary/50"
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
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 hover:bg-primary/10"
            >
              <Link href={`/series/${seriesId}/edit`}>Editar Série</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
