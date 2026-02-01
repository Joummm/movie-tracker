// components/series/season-detail.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Star,
  Eye,
  Film,
  List,
  BarChart3,
  Edit,
  Plus,
  MoreVertical,
  CheckCircle,
  Timer,
  MessageSquare,
  RefreshCw,
  EyeOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Interface simplificada para episódio
interface Episode {
  id: string;
  episode_number: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  rating?: number;
  review?: string;
  release_date?: string;
  created_at: string;
  would_recommend?: boolean;
  would_rewatch?: boolean;
  rewatch_count?: number;
}

// Interface simplificada para temporada
interface Season {
  id: string;
  season_number: number;
  name?: string;
  episode_count: number;
  watched_episode_count: number;
  is_special: boolean;
  poster_vertical?: string;
  poster_horizontal?: string;
  release_year?: number;
  average_rating?: number;
  total_watch_time: number;
  special_type?: string;
  description?: string;
  series?: {
    id: string;
    name?: string;
    cover_image?: string;
  };
}

interface SeasonDetailProps {
  season: Season;
  seriesId: string;
  episodes: Episode[];
  userId: string;
}

export function SeasonDetail({
  season,
  seriesId,
  episodes,
  userId,
}: SeasonDetailProps) {
  const [activeTab, setActiveTab] = useState("episodes");
  const router = useRouter();
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>(episodes);
  const [watchFilter, setWatchFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // Filtrar episódios
  useEffect(() => {
    let result = [...episodes];

    if (watchFilter === "watched") {
      result = result.filter((ep) => ep.is_watched);
    } else if (watchFilter === "unwatched") {
      result = result.filter((ep) => !ep.is_watched);
    }

    setFilteredEpisodes(result);
  }, [episodes, watchFilter]);

  const progress =
    season.episode_count > 0
      ? Math.round((season.watched_episode_count / season.episode_count) * 100)
      : 0;

  const isComplete = progress === 100;

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  // Função para navegar para detalhes do episódio
  const handleEpisodeClick = (episode: Episode, e?: React.MouseEvent) => {
    // Permitir cliques nos botões sem navegar
    if (e && (e.target as HTMLElement).closest('button, a, [role="button"]')) {
      return;
    }
    router.push(
      `/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}`,
    );
  };

  // Calculate episode statistics
  const watchedEpisodes = episodes.filter((ep) => ep.is_watched).length;
  const averageEpisodeRating =
    episodes.filter((ep) => ep.rating && ep.rating > 0).length > 0
      ? episodes
          .filter((ep) => ep.rating && ep.rating > 0)
          .reduce((sum, ep) => sum + ep.rating!, 0) /
        episodes.filter((ep) => ep.rating && ep.rating > 0).length
      : 0;

  const totalEpisodeDuration = episodes.reduce(
    (sum, ep) => sum + (ep.duration || 0),
    0,
  );

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      // Recalcular estatísticas
      const totalEpisodes = episodes.length;
      const watchedEpisodes = episodes.filter((ep) => ep.is_watched).length;
      const totalWatchTime = episodes.reduce(
        (sum, ep) => sum + (ep.duration || 0),
        0,
      );
      const ratedEpisodes = episodes.filter((ep) => ep.rating && ep.rating > 0);
      const averageRating =
        ratedEpisodes.length > 0
          ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
            ratedEpisodes.length
          : 0;

      // Atualizar temporada
      const { error } = await supabase
        .from("series_seasons")
        .update({
          episode_count: totalEpisodes,
          watched_episode_count: watchedEpisodes,
          average_rating: averageRating > 0 ? averageRating : null,
          total_watch_time: totalWatchTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", season.id);

      if (error) throw error;

      toast.success("Estatísticas atualizadas!", {
        description: "Os dados da temporada foram recalculados.",
        duration: 3000,
      });

      // Atualizar a página
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Erro ao atualizar estatísticas:", error);
      toast.error("Erro ao atualizar", {
        description: "Não foi possível atualizar as estatísticas.",
        duration: 4000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleEpisodeWatchStatus = async (
    episode: Episode,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("series_episodes")
        .update({
          is_watched: !episode.is_watched,
          watched_date: !episode.is_watched ? new Date().toISOString() : null,
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
    }
  };

  const openEditEpisode = (episode: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEpisode(episode);
    setIsEditDialogOpen(true);
  };

  const handleEpisodeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEpisode) return;

    setIsLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const { error } = await supabase
        .from("series_episodes")
        .update({
          name: formData.get("name") || null,
          duration: formData.get("duration")
            ? parseInt(formData.get("duration") as string)
            : null,
          rating: formData.get("rating")
            ? parseFloat(formData.get("rating") as string)
            : null,
          review: formData.get("review") || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedEpisode.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Episódio atualizado!", {
        description: "As alterações foram guardadas.",
        duration: 3000,
      });

      setIsEditDialogOpen(false);
      setTimeout(() => {
        window.location.reload();
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
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-primary/5 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <List className="h-4 w-4" />
                <span>Episódios</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {season.episode_count}
                </span>
                <span className="text-sm text-muted-foreground">total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-emerald-500/5 to-green-500/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Assistidos</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {season.watched_episode_count}
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-amber-500/5 to-yellow-500/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span>Avaliação</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {season.average_rating
                    ? season.average_rating.toFixed(1)
                    : "-"}
                </span>
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-blue-500/5 to-cyan-500/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duração</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {getDurationText(season.total_watch_time)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progresso */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-semibold">Progresso da Temporada</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshStats}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Atualizar</span>
                </Button>
                <Button size="sm" asChild>
                  <Link
                    href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Episódio
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {season.watched_episode_count} de {season.episode_count}{" "}
                  episódios assistidos
                </span>
                <span className="font-semibold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="episodes" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Episódios
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={watchFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setWatchFilter("all")}
                className="h-8 px-3 rounded-r-none"
              >
                Todos
              </Button>
              <Button
                variant={watchFilter === "watched" ? "default" : "ghost"}
                size="sm"
                onClick={() => setWatchFilter("watched")}
                className="h-8 px-3 rounded-none"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Assistidos
              </Button>
              <Button
                variant={watchFilter === "unwatched" ? "default" : "ghost"}
                size="sm"
                onClick={() => setWatchFilter("unwatched")}
                className="h-8 px-3 rounded-l-none"
              >
                <EyeOff className="h-3.5 w-3.5 mr-1" />
                Não Assistidos
              </Button>
            </div>
          </div>
        </div>

        {/* Episodes Tab */}
        <TabsContent value="episodes" className="m-0">
          <Card>
            <CardContent className="p-0">
              {filteredEpisodes.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {filteredEpisodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={(e) => handleEpisodeClick(episode, e)}
                    >
                      {/* Número do episódio */}
                      <div className="shrink-0">
                        <div
                          className={`h-12 w-12 rounded-lg flex items-center justify-center ${episode.is_watched ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                        >
                          <span className="font-bold text-lg">
                            {episode.episode_number}
                          </span>
                        </div>
                      </div>

                      {/* Informações do episódio */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">
                            {episode.name ||
                              `Episódio ${episode.episode_number}`}
                          </h4>
                          {episode.is_watched && (
                            <Badge variant="outline" className="h-5 px-1.5">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Assistido
                            </Badge>
                          )}
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {episode.duration && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3.5 w-3.5" />
                              {getDurationText(episode.duration)}
                            </span>
                          )}

                          {episode.rating && episode.rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                              {episode.rating.toFixed(1)}
                            </span>
                          )}

                          {episode.release_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(episode.release_date)}
                            </span>
                          )}
                        </div>

                        {episode.review && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
                            {episode.review}
                          </p>
                        )}
                      </div>

                      {/* Ações */}
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant={episode.is_watched ? "outline" : "default"}
                          onClick={(e) => toggleEpisodeWatchStatus(episode, e)}
                        >
                          {episode.is_watched ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Não Assistido
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Assistido
                            </>
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}/edit`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Lógica de exclusão aqui
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Film className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {episodes.length === 0
                      ? "Nenhum episódio encontrado"
                      : "Nenhum episódio correspondente ao filtro"}
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    {episodes.length === 0
                      ? "Adicione episódios para começar a acompanhar esta temporada."
                      : "Tente alterar o filtro para ver mais episódios."}
                  </p>
                  {episodes.length === 0 && (
                    <Button className="mt-6" asChild>
                      <Link
                        href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Episódio
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Total de Episódios
                  </p>
                  <p className="text-3xl font-bold">{season.episode_count}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Assistidos</p>
                  <p className="text-3xl font-bold">
                    {season.watched_episode_count}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="text-3xl font-bold">{progress}%</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Duração Total</p>
                  <p className="text-3xl font-bold">
                    {getDurationText(season.total_watch_time)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Avaliação Média
                  </p>
                  <p className="text-3xl font-bold">
                    {season.average_rating
                      ? season.average_rating.toFixed(1)
                      : "-"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Duração Média</p>
                  <p className="text-3xl font-bold">
                    {season.episode_count > 0
                      ? Math.round(
                          season.total_watch_time / season.episode_count,
                        )
                      : 0}{" "}
                    min
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="text-3xl font-bold">
                    {season.release_year || "-"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-3xl font-bold">
                    {season.is_special ? "Especial" : "Regular"}
                  </p>
                </div>
              </div>

              {/* Gráficos de distribuição */}
              <div className="mt-8 space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">
                    Distribuição por Avaliação
                  </h4>
                  <div className="space-y-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                      const count = episodes.filter(
                        (ep) => ep.rating === rating,
                      ).length;
                      const percentage =
                        episodes.length > 0
                          ? (count / episodes.length) * 100
                          : 0;

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="w-8 text-sm font-medium">
                            {rating}
                          </span>
                          <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-yellow-500 to-orange-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-sm text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">
                    Distribuição por Duração
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Episódios curtos (&lt;30min)
                      </p>
                      <p className="text-2xl font-bold">
                        {
                          episodes.filter(
                            (ep) => ep.duration && ep.duration < 30,
                          ).length
                        }
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Episódios longos (&gt;60min)
                      </p>
                      <p className="text-2xl font-bold">
                        {
                          episodes.filter(
                            (ep) => ep.duration && ep.duration > 60,
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de edição de episódio */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>
              Editar Episódio {selectedEpisode?.episode_number}
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do episódio.
            </DialogDescription>
          </DialogHeader>

          {selectedEpisode && (
            <form onSubmit={handleEpisodeUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Episódio</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedEpisode.name || ""}
                    placeholder="Nome do episódio"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      defaultValue={selectedEpisode.duration || ""}
                      placeholder="45"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Avaliação (0-10)</Label>
                    <Input
                      id="rating"
                      name="rating"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      defaultValue={selectedEpisode.rating || ""}
                      placeholder="8.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review">Review (opcional)</Label>
                  <Textarea
                    id="review"
                    name="review"
                    defaultValue={selectedEpisode.review || ""}
                    placeholder="O que achou deste episódio?"
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Alterações"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
