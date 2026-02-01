// components/series/EpisodeDetail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Edit,
  ArrowLeft,
  CheckCircle,
  EyeOff,
  ThumbsUp,
  RefreshCw,
  Tv,
  Hash,
  AlertCircle,
  Info,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EpisodeDetailProps {
  episode: any;
  series: any;
  season: any;
  userId: string;
}

export function EpisodeDetail({
  episode,
  series,
  season,
  userId,
}: EpisodeDetailProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDurationText = (minutes?: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  const toggleWatchStatus = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("series_episodes")
        .update({
          is_watched: !episode.is_watched,
          updated_at: new Date().toISOString(),
        })
        .eq("id", episode.id);

      if (error) throw error;

      const { data: episodes } = await supabase
        .from("series_episodes")
        .select("id, is_watched, rating, duration")
        .eq("season_id", season.id);

      if (episodes) {
        const totalEpisodes = episodes.length;
        const watchedEpisodes = episodes.filter((ep) => ep.is_watched).length;
        const totalWatchTime = episodes.reduce(
          (sum, ep) => sum + (ep.duration || 0),
          0,
        );
        const ratedEpisodes = episodes.filter(
          (ep) => ep.rating && ep.rating > 0,
        );
        const averageRating =
          ratedEpisodes.length > 0
            ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
              ratedEpisodes.length
            : 0;

        await supabase
          .from("series_seasons")
          .update({
            episode_count: totalEpisodes,
            watched_episode_count: watchedEpisodes,
            average_rating: averageRating > 0 ? averageRating : null,
            total_watch_time: totalWatchTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", season.id)
          .eq("user_id", userId);
      }

      toast.success(
        episode.is_watched
          ? "Episódio marcado como não assistido"
          : "Episódio marcado como assistido",
        {
          description: `Episódio ${episode.episode_number} atualizado.`,
          duration: 3000,
        },
      );

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Erro ao atualizar episódio:", error);
      toast.error("Erro ao atualizar", {
        description: "Não foi possível atualizar o episódio.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              router.push(`/series/${series.id}/seasons/${season.id}`)
            }
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="link"
                onClick={() => router.push(`/series/${series.id}`)}
                className="text-muted-foreground hover:text-primary p-0 h-auto"
              >
                {series.name}
              </Button>
              <span className="text-muted-foreground">/</span>
              <Button
                variant="link"
                onClick={() =>
                  router.push(`/series/${series.id}/seasons/${season.id}`)
                }
                className="text-muted-foreground hover:text-primary p-0 h-auto"
              >
                {season.is_special
                  ? "Especial"
                  : `Temporada ${season.season_number}`}
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold">
                Episódio {episode.episode_number}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {episode.name || `Episódio ${episode.episode_number}`}
            </h1>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={toggleWatchStatus}
            disabled={isLoading}
            variant={episode.is_watched ? "outline" : "default"}
            className="gap-2"
          >
            {episode.is_watched ? (
              <>
                <EyeOff className="h-4 w-4" />
                Marcar como Não Assistido
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Marcar como Assistido
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              router.push(
                `/series/${series.id}/seasons/${season.id}/episodes/${episode.id}/edit`,
              )
            }
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>

          <div className="ml-auto flex items-center gap-4">
            {episode.rating && episode.rating > 0 && (
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-1" />
                <span className="font-bold">{episode.rating}/10</span>
              </Badge>
            )}
            {episode.would_recommend && (
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                Recomendaria
              </Badge>
            )}
            {episode.would_rewatch && (
              <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Assistiria novamente
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Episode Details - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Card */}
          {episode.review && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Minha Crítica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {episode.review}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Episode Statistics */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Estatísticas do Episódio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="text-xl font-semibold">
                    {getDurationText(episode.duration)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${episode.is_watched ? "bg-emerald-500" : "bg-yellow-500"}`}
                    />
                    <p className="text-xl font-semibold">
                      {episode.is_watched ? "Assistido" : "Não Assistido"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Vezes Reassistido
                  </p>
                  <p className="text-xl font-semibold">
                    {episode.rewatch_count || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Última Revisão
                  </p>
                  <p className="text-xl font-semibold">
                    {episode.last_rewatch_date
                      ? formatDate(episode.last_rewatch_date)
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Episode Info Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Informações do Episódio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {episode.episode_number}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {getDurationText(episode.duration)}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">
                  Data de Lançamento
                </p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(episode.release_date)}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Série</p>
                <p className="font-medium flex items-center gap-2">
                  <Tv className="h-4 w-4" />
                  {series.name}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Temporada</p>
                <p className="font-medium">
                  {season.is_special
                    ? "Especial"
                    : `Temporada ${season.season_number}`}
                  {season.name && `: ${season.name}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="border-border/50 bg-linear-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Metadados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1 text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Criado em</span>
                  <span className="font-medium">
                    {new Date(episode.created_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Atualizado em</span>
                  <span className="font-medium">
                    {new Date(episode.updated_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="pt-2">
                <p className="font-medium text-foreground mb-1">
                  ID do Episódio
                </p>
                <p className="text-xs text-muted-foreground font-mono break-all bg-muted/50 p-2 rounded">
                  {episode.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
