// components/series/episodes-list.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  Filter,
  Tv,
  Eye,
  EyeOff,
  Star,
  Calendar,
  Clock,
  MoreVertical,
  ArrowLeft,
  List,
  CheckCircle2,
  Play,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatDate } from "date-fns";

interface Episode {
  id: string;
  episode_number: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  rating?: number;
  release_date?: string;
  review?: string;
  would_recommend?: boolean;
  would_rewatch?: boolean;
  content?: {
    id: string;
    name?: string;
    rating?: number;
    watched_date?: string;
  };
}

interface Season {
  id: string;
  season_number: number;
  name?: string;
  is_special: boolean;
  series?: {
    id: string;
    name?: string;
  };
}

interface EpisodesListProps {
  seriesId: string;
  seriesName: string;
  seasonId: string;
  season: Season;
  episodes: Episode[];
  stats: {
    total_episodes: number;
    watched_episodes: number;
    completion_percentage: number;
    average_rating: number;
    total_watch_time: number;
  };
  userId: string;
}

export function EpisodesList({
  seriesId,
  seriesName,
  seasonId,
  season,
  episodes,
  stats,
  userId,
}: EpisodesListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredEpisodes = episodes.filter((episode) => {
    // Apply search filter
    const matchesSearch =
      episode.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `Episódio ${episode.episode_number}`.includes(searchQuery) ||
      episode.review?.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply status filter
    const matchesFilter =
      filter === "all" ||
      (filter === "watched" && episode.is_watched) ||
      (filter === "unwatched" && !episode.is_watched);

    return matchesSearch && matchesFilter;
  });

  const handleMarkAsWatched = async (
    episodeId: string,
    currentlyWatched: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("series_episodes")
        .update({
          is_watched: !currentlyWatched,
          updated_at: new Date().toISOString(),
        })
        .eq("id", episodeId);

      if (error) throw error;

      // Update season watched count
      const newWatchedCount = currentlyWatched
        ? stats.watched_episodes - 1
        : stats.watched_episodes + 1;

      await supabase
        .from("series_seasons")
        .update({
          watched_episode_count: newWatchedCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId);

      alert(
        `Episódio marcado como ${!currentlyWatched ? "assistido" : "não assistido"}!`,
      );
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao atualizar episódio:", error);
      alert(`Erro: ${error.message}`);
    }
  };

  const handleDelete = async (episodeId: string) => {
    if (!confirm("Tem certeza que deseja excluir este episódio?")) {
      return;
    }

    setIsDeleting(episodeId);

    try {
      const { error } = await supabase
        .from("series_episodes")
        .delete()
        .eq("id", episodeId);

      if (error) throw error;

      // Update season episode count
      await supabase
        .from("series_seasons")
        .update({
          episode_count: stats.total_episodes - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId);

      alert("Episódio excluído com sucesso!");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao excluir episódio:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/series/${seriesId}/seasons`)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Episódios</h1>
            <p className="text-muted-foreground">
              {season.is_special
                ? "Especial"
                : `Temporada ${season.season_number}`}
              {season.name && `: ${season.name}`} • {seriesName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/series/${seriesId}/seasons/${seasonId}/episodes/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Episódio
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Tv className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Episódios</p>
                <p className="text-2xl font-bold">
                  {stats.watched_episodes}/{stats.total_episodes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completos</p>
                <p className="text-2xl font-bold">
                  {stats.completion_percentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avaliação</p>
                <p className="text-2xl font-bold">
                  {stats.average_rating > 0
                    ? stats.average_rating.toFixed(1)
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.total_watch_time / 60)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progresso da Temporada</span>
              <span className="font-semibold">
                {stats.completion_percentage}%
              </span>
            </div>
            <Progress value={stats.completion_percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {stats.watched_episodes} de {stats.total_episodes} episódios
                assistidos
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                onClick={() => {
                  const unwatched = episodes.filter((ep) => !ep.is_watched);
                  if (unwatched.length === 0) {
                    alert("Todos os episódios já foram assistidos!");
                    return;
                  }
                  if (
                    confirm(
                      `Marcar todos os ${unwatched.length} episódios não assistidos como assistidos?`,
                    )
                  ) {
                    unwatched.forEach(async (ep) => {
                      await handleMarkAsWatched(ep.id, false);
                    });
                  }
                }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Marcar Todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar episódios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex rounded-lg border">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="h-9 px-3"
          >
            Todos
          </Button>
          <Button
            variant={filter === "watched" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("watched")}
            className="h-9 px-3"
          >
            <Eye className="h-4 w-4 mr-2" />
            Assistidos
          </Button>
          <Button
            variant={filter === "unwatched" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("unwatched")}
            className="h-9 px-3"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Não Assistidos
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredEpisodes.length} de {episodes.length} episódios
      </div>

      {/* Episodes List */}
      {filteredEpisodes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum episódio encontrado</p>
          <p className="text-sm mt-2">
            {searchQuery || filter !== "all"
              ? "Tente ajustar sua busca ou filtro"
              : "Adicione seu primeiro episódio a esta temporada"}
          </p>
          {!searchQuery && filter === "all" && (
            <Button className="mt-4" asChild>
              <Link
                href={`/series/${seriesId}/seasons/${seasonId}/episodes/new`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Episódio
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEpisodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              seriesId={seriesId}
              seasonId={seasonId}
              onMarkAsWatched={() =>
                handleMarkAsWatched(episode.id, episode.is_watched)
              }
              onDelete={() => handleDelete(episode.id)}
              isDeleting={isDeleting === episode.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  seriesId: string;
  seasonId: string;
  onMarkAsWatched: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function EpisodeCard({
  episode,
  seriesId,
  seasonId,
  onMarkAsWatched,
  onDelete,
  isDeleting,
}: EpisodeCardProps) {
  const router = useRouter();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Episode Number */}
          <div className="flex-shrink-0">
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                episode.is_watched
                  ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="font-bold text-lg">
                {episode.episode_number}
              </span>
            </div>
          </div>

          {/* Episode Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">
                    {episode.name || `Episódio ${episode.episode_number}`}
                  </h3>
                  {episode.is_watched && (
                    <Badge className="bg-green-500 text-white border-none">
                      <Eye className="h-3 w-3 mr-1" />
                      Assistido
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  {episode.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(episode.duration)} min
                    </span>
                  )}
                  {episode.release_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(episode.release_date).toLocaleDateString(
                        "pt-PT",
                      )}
                    </span>
                  )}
                  {episode.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {episode.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {episode.review && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {episode.review}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onMarkAsWatched}>
                    {episode.is_watched ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Marcar como Não Assistido
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Marcar como Assistido
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}/edit`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent mr-2" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content Link */}
            {episode.content && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Conteúdo vinculado:{" "}
                    </span>
                    <span className="font-medium">
                      {episode.content.name || "Sem nome"}
                    </span>
                    {episode.content.watched_date && (
                      <span className="text-xs text-muted-foreground ml-2">
                        Assistido em{" "}
                        {formatDate(episode.content.watched_date, "")}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="h-7 text-xs"
                  >
                    <Link href={`/content/${episode.content.id}`}>
                      <Play className="h-3 w-3 mr-1" />
                      Ver
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        {(episode.would_recommend !== null ||
          episode.would_rewatch !== null) && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            {episode.would_recommend !== null && (
              <Badge
                variant={episode.would_recommend ? "default" : "secondary"}
              >
                {episode.would_recommend ? "Recomendaria" : "Não Recomendaria"}
              </Badge>
            )}
            {episode.would_rewatch !== null && (
              <Badge variant={episode.would_rewatch ? "default" : "secondary"}>
                {episode.would_rewatch
                  ? "Assistiria Novamente"
                  : "Não Assistiria Novamente"}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
