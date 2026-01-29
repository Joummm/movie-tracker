// components/series/episodes-list.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  List,
  Plus,
  Eye,
  EyeOff,
  Star,
  Clock,
  Calendar,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";

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
}

interface Season {
  id: string;
  season_number: number;
  name?: string;
  is_special: boolean;
}

interface EpisodesListProps {
  episodes: Episode[];
  season: Season;
  seriesId: string;
}

export function EpisodesList({
  episodes,
  season,
  seriesId,
}: EpisodesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWatched, setFilterWatched] = useState<
    "all" | "watched" | "unwatched"
  >("all");
  const [sortBy, setSortBy] = useState<"number" | "rating" | "date">("number");

  // Filter and sort episodes
  const filteredEpisodes = episodes
    .filter((episode) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          episode.name?.toLowerCase().includes(query) ||
          episode.episode_number.toString().includes(query)
        );
      }

      // Watched filter
      if (filterWatched === "watched" && !episode.is_watched) return false;
      if (filterWatched === "unwatched" && episode.is_watched) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        case "date":
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        case "number":
        default:
          return a.episode_number - b.episode_number;
      }
    });

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
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  if (episodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum episódio</h3>
            <p className="text-muted-foreground mb-6">
              Esta temporada ainda não tem episódios adicionados.
            </p>
            <Button asChild>
              <Link
                href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Episódio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {filteredEpisodes.length} de {episodes.length} episódios
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar episódios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>

          <Button asChild>
            <Link
              href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Episódio
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterWatched === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterWatched("all")}
        >
          Todos
        </Button>
        <Button
          variant={filterWatched === "watched" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterWatched("watched")}
        >
          <Eye className="h-4 w-4 mr-2" />
          Assistidos
        </Button>
        <Button
          variant={filterWatched === "unwatched" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterWatched("unwatched")}
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Não Assistidos
        </Button>

        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="number">Ordenar por Número</option>
            <option value="rating">Ordenar por Avaliação</option>
            <option value="date">Ordenar por Data</option>
          </select>
        </div>
      </div>

      {/* Episodes List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Título
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Duração
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Avaliação
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEpisodes.map((episode) => (
                  <tr key={episode.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">
                      {episode.episode_number}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">
                          {episode.name || `Episódio ${episode.episode_number}`}
                        </div>
                        {episode.review && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {episode.review}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={episode.is_watched ? "default" : "secondary"}
                      >
                        {episode.is_watched ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Assistido
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Não Assistido
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {getDurationText(episode.duration)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(episode.release_date)}
                      </div>
                    </td>
                    <td className="p-4">
                      {episode.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          {episode.rating.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}`}
                            >
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}/edit`}
                            >
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}/watch`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {episode.is_watched
                                ? "Adicionar Visualização"
                                : "Marcar como Assistido"}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {filteredEpisodes.map((episode) => (
          <Card key={episode.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        #{episode.episode_number}
                      </span>
                      <Badge
                        variant={episode.is_watched ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {episode.is_watched ? "Assistido" : "Não Assistido"}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mt-1">
                      {episode.name || `Episódio ${episode.episode_number}`}
                    </h4>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}`}
                        >
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}/edit`}
                        >
                          Editar
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{getDurationText(episode.duration)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(episode.release_date)}</span>
                  </div>

                  {episode.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>{episode.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {episode.review && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {episode.review}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link
                      href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}`}
                    >
                      Ver Detalhes
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link
                      href={`/series/${seriesId}/seasons/${season.id}/episodes/${episode.id}/watch`}
                    >
                      {episode.is_watched ? "Reassistir" : "Assistir"}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
