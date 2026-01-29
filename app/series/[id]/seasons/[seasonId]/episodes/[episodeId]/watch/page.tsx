// app/series/[id]/seasons/[seasonId]/episodes/[episodeId]/watch/page.tsx - VERSÃO CORRIGIDA
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { WatchEpisodeForm } from "@/components/series/forms/watch-episode-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface WatchEpisodePageProps {
  params: Promise<{
    id: string;
    seasonId: string;
    episodeId: string;
  }>;
}

export default async function WatchEpisodePage({
  params,
}: WatchEpisodePageProps) {
  const { id, seasonId, episodeId } = await params;
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

  // Get season info
  const { data: season } = await supabase
    .from("series_seasons")
    .select("id, season_number, name, is_special")
    .eq("id", seasonId)
    .eq("user_id", user.id)
    .single();

  if (!season) {
    redirect(`/series/${seriesId}/seasons`);
  }

  // Get episode data
  let episode: any = null;
  const { data: episodeFromTable } = await supabase
    .from("series_episodes")
    .select("*")
    .eq("id", episodeId)
    .single();

  if (episodeFromTable) {
    episode = episodeFromTable;
  } else {
    const { data: episodeFromContent } = await supabase
      .from("content")
      .select("*")
      .eq("id", episodeId)
      .eq("user_id", user.id)
      .single();

    if (episodeFromContent) {
      episode = {
        id: episodeFromContent.id,
        episode_number: episodeFromContent.episode || 0,
        name: episodeFromContent.name,
        duration: episodeFromContent.duration,
        is_watched: episodeFromContent.watch_status === "completed",
        rating: episodeFromContent.rating,
        review: episodeFromContent.review,
        release_date: episodeFromContent.watched_date,
        would_recommend: episodeFromContent.would_recommend,
        would_rewatch: episodeFromContent.would_rewatch,
        rewatch_count: episodeFromContent.rewatch_count || 0,
        last_rewatch_date: episodeFromContent.last_rewatch_date,
        notes: episodeFromContent.notes,
      };
    }
  }

  if (!episode) {
    redirect(`/series/${seriesId}/seasons/${seasonId}`);
  }

  // Get existing viewings for this episode - precisamos primeiro encontrar o content_id
  let contentId = episode.id;
  const { data: relatedContent } = await supabase
    .from("content")
    .select("id")
    .eq("series_id", seriesId)
    .eq("season", season.season_number)
    .eq("episode", episode.episode_number)
    .eq("user_id", user.id)
    .single();

  if (relatedContent) {
    contentId = relatedContent.id;
  }

  const { data: existingViewings } = await supabase
    .from("content_viewings")
    .select("*")
    .eq("content_id", contentId)
    .order("watched_date", { ascending: false });

  // Get watch sessions for dropdown
  const { data: watchSessions } = await supabase
    .from("watch_sessions")
    .select("id, start_time, platform, device")
    .eq("user_id", user.id)
    .order("start_time", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={user.email?.split("@")[0] || "User"} />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="h-10 w-10"
              >
                <Link
                  href={`/series/${seriesId}/seasons/${seasonId}/episodes/${episodeId}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {episode.is_watched
                    ? "Adicionar Visualização"
                    : "Marcar como Assistido"}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Link
                    href={`/series/${seriesId}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {series.name}
                  </Link>
                  <span>•</span>
                  <Link
                    href={`/series/${seriesId}/seasons/${seasonId}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {season.is_special
                      ? "Especial"
                      : `Temporada ${season.season_number}`}
                    {season.name && `: ${season.name}`}
                  </Link>
                  <span>•</span>
                  <span>
                    {episode.name || `Episódio ${episode.episode_number}`}
                  </span>
                </div>
              </div>
            </div>

            <Badge
              variant={episode.is_watched ? "default" : "secondary"}
              className="gap-2"
            >
              <Eye className="h-3 w-3" />
              {episode.is_watched
                ? `Assistido ${episode.rewatch_count || 0}x`
                : "Não Assistido"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <WatchEpisodeForm
                episode={episode}
                seriesId={seriesId}
                seasonId={seasonId}
                userId={user.id}
                existingViewings={existingViewings || []}
                watchSessions={watchSessions || []}
              />
            </div>

            {/* Right Column - Info & Stats */}
            <div className="space-y-6">
              {/* Episode Info */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Informações do Episódio
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">
                      {episode.name || `Episódio ${episode.episode_number}`}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {episode.release_date
                            ? new Date(episode.release_date).toLocaleDateString(
                                "pt-PT",
                              )
                            : "Data não especificada"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {episode.duration
                            ? `${Math.floor(episode.duration / 60)}h ${episode.duration % 60}min`
                            : "Duração não especificada"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {episode.rewatch_count > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">
                        Histórico de Visualizações
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Este episódio já foi assistido {episode.rewatch_count}{" "}
                        vez{episode.rewatch_count !== 1 ? "es" : ""}.
                      </p>
                      {episode.last_rewatch_date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Última vez:{" "}
                          {new Date(
                            episode.last_rewatch_date,
                          ).toLocaleDateString("pt-PT")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href={`/series/${seriesId}/seasons/${seasonId}/episodes/${episodeId}/edit`}
                    >
                      Editar Detalhes do Episódio
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href={`/series/${seriesId}/seasons/${seasonId}/episodes/${episodeId}`}
                    >
                      Ver Detalhes do Episódio
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href={`/series/${seriesId}/seasons/${seasonId}/episodes`}
                    >
                      Ver Todos os Episódios
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
