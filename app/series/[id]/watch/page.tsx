// app/series/[id]/watch/page.tsx - VERSÃO CORRIGIDA
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuickWatchForm } from "@/components/series/forms/quick-watch-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WatchSeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WatchSeriesPage({
  params,
}: WatchSeriesPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const seriesId = id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get series info
  const { data: series } = await supabase
    .from("series")
    .select("id, name, cover_image")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!series) {
    redirect("/series");
  }

  // Buscar temporadas
  const { data: seasons } = await supabase
    .from("series_seasons")
    .select(
      `
      id,
      season_number,
      name,
      is_special
    `,
    )
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .order("season_number", { ascending: true });

  let episodesData = seasons || [];

  // Para cada temporada, buscar episódios
  if (episodesData.length > 0) {
    const seasonsWithEpisodes = await Promise.all(
      episodesData.map(async (season) => {
        // Primeiro tentar da tabela series_episodes
        const { data: seriesEpisodes } = await supabase
          .from("series_episodes")
          .select(
            `
            id,
            episode_number,
            name,
            duration,
            is_watched,
            rewatch_count,
            last_rewatch_date
          `,
          )
          .eq("season_id", season.id)
          .eq("user_id", user.id)
          .order("episode_number", { ascending: true });

        if (seriesEpisodes && seriesEpisodes.length > 0) {
          return {
            ...season,
            series_episodes: seriesEpisodes,
          };
        }

        // Se não encontrar, tentar da tabela content
        const { data: contentEpisodes } = await supabase
          .from("content")
          .select(
            `
            id,
            episode_number: episode,
            name,
            duration,
            is_watched: watch_status,
            rewatch_count,
            last_rewatch_date
          `,
          )
          .eq("series_id", seriesId)
          .eq("season", season.season_number)
          .eq("user_id", user.id)
          .eq("type", "episode")
          .order("episode", { ascending: true });

        if (contentEpisodes && contentEpisodes.length > 0) {
          return {
            ...season,
            series_episodes: contentEpisodes.map((ep) => ({
              ...ep,
              is_watched: ep.is_watched === "completed",
            })),
          };
        }

        // Se não encontrar episódios, retornar temporada vazia
        return {
          ...season,
          series_episodes: [],
        };
      }),
    );

    episodesData = seasonsWithEpisodes;
  } else {
    // Se não houver temporadas, buscar episódios diretamente da tabela content
    const { data: contentEpisodes } = await supabase
      .from("content")
      .select(
        `
        id,
        episode_number: episode,
        name,
        duration,
        is_watched: watch_status,
        rewatch_count,
        last_rewatch_date,
        season
      `,
      )
      .eq("series_id", seriesId)
      .eq("user_id", user.id)
      .eq("type", "episode")
      .order("season", { ascending: true })
      .order("episode", { ascending: true });

    if (contentEpisodes && contentEpisodes.length > 0) {
      // Agrupar por temporada
      const seasonsMap = new Map();

      contentEpisodes.forEach((episode) => {
        const seasonKey = episode.season || 1;
        const seasonId = `season-${seasonKey}`;

        if (!seasonsMap.has(seasonId)) {
          seasonsMap.set(seasonId, {
            id: seasonId,
            season_number: seasonKey,
            name: `Temporada ${seasonKey}`,
            is_special: false,
            series_episodes: [],
          });
        }

        seasonsMap.get(seasonId).series_episodes.push({
          id: episode.id,
          episode_number: episode.episode_number || 0,
          name: episode.name,
          duration: episode.duration,
          is_watched: episode.is_watched === "completed",
          rewatch_count: episode.rewatch_count || 0,
          last_rewatch_date: episode.last_rewatch_date,
        });
      });

      episodesData = Array.from(seasonsMap.values());
    }
  }

  console.log("Final episodes data:", episodesData);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={user.email?.split("@")[0] || "User"} />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild className="h-10 w-10">
              <Link href={`/series/${seriesId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Marcar Episódios de {series.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Marque múltiplos episódios como assistidos rapidamente
              </p>
            </div>
          </div>

          {/* Quick Watch Form */}
          {episodesData && episodesData.length > 0 ? (
            <QuickWatchForm
              seriesId={seriesId}
              seriesName={series.name}
              seasons={episodesData}
              userId={user.id}
            />
          ) : (
            <div className="text-center py-12">
              <div className="bg-card rounded-lg border p-8">
                <h2 className="text-xl font-semibold mb-4">
                  Nenhum episódio encontrado
                </h2>
                <p className="text-muted-foreground mb-6">
                  Esta série ainda não tem episódios adicionados.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href={`/series/${seriesId}/seasons/new`}>
                      Adicionar Temporada
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/series/${seriesId}/seasons`}>
                      Ver Temporadas
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
