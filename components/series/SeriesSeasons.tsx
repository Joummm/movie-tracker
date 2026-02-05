// components/series/series-seasons.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Tv,
  Calendar,
  Star,
  Eye,
  MoreVertical,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";

interface Season {
  id: string;
  season_number: number;
  name?: string;
  episode_count: number;
  watched_episode_count: number;
  is_special: boolean;
  poster_vertical?: string;
  release_year?: number;
  average_rating?: number;
  total_watch_time: number;
}

interface SeriesSeasonsProps {
  seriesId: string;
  seasons: Season[];
  userId: string;
}

export function SeriesSeasons({
  seriesId,
  seasons,
  userId,
}: SeriesSeasonsProps) {
  const sortedSeasons = [...seasons].sort(
    (a, b) => a.season_number - b.season_number,
  );

  const calculateProgress = (watched: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((watched / total) * 100);
  };

  const getDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  return (
    <Card className="border-border/30 bg-card/40 backdrop-blur-sm shadow-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-linear-to-r from-primary/5 via-primary/5 to-transparent border-b border-border/30">
        <div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Temporadas
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e acompanhe todas as temporadas da série
          </p>
        </div>
        <Button
          size="sm"
          asChild
          className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg"
        >
          <Link href={`/series/${seriesId}/seasons/new`}>
            <Plus className="h-4 w-4" />
            Nova Temporada
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {sortedSeasons.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 rounded-full bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5">
              <Tv className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma temporada ainda
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece adicionando temporadas para organizar seus episódios e
              acompanhar seu progresso
            </p>
            <Button
              asChild
              className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              <Link href={`/series/${seriesId}/seasons/new`}>
                <Plus className="h-4 w-4" />
                Adicionar Primeira Temporada
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSeasons.map((season) => {
              const progress = calculateProgress(
                season.watched_episode_count,
                season.episode_count,
              );
              const isComplete = progress === 100;

              return (
                <Link
                  key={season.id}
                  href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                  className="block group"
                >
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-card/50 hover:bg-linear-to-r hover:from-primary/5 hover:via-primary/5 hover:to-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-md">
                    {/* Season Poster */}
                    <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden border border-border/30 shadow-sm group-hover:shadow-md transition-shadow">
                      {season.poster_vertical ? (
                        <Image
                          src={season.poster_vertical}
                          alt={
                            season.name || `Temporada ${season.season_number}`
                          }
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-linear-to-br from-muted/30 to-muted/10">
                          <div className="text-center">
                            <Tv className="h-8 w-8 text-muted-foreground mb-1 mx-auto" />
                            <div className="text-xs font-semibold text-muted-foreground">
                              {season.is_special
                                ? "ESPECIAL"
                                : `T${season.season_number}`}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Season Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {season.is_special
                                ? "Especial"
                                : `Temporada ${season.season_number}`}
                              {season.name && `: ${season.name}`}
                            </h3>
                            {season.is_special ? (
                              <Badge
                                variant="default"
                                className="bg-purple-500 hover:bg-purple-600 text-white border-none text-xs"
                              >
                                Especial
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-blue-500/30 text-blue-600 bg-blue-500/10 text-xs"
                              >
                                T{season.season_number}
                              </Badge>
                            )}
                            {isComplete && (
                              <Badge
                                variant="default"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white border-none h-5 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Completa
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Tv className="h-3 w-3" />
                              {season.episode_count} episódios
                            </span>
                            {season.release_year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {season.release_year}
                              </span>
                            )}
                            {season.average_rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {season.average_rating.toFixed(1)}
                              </span>
                            )}
                            {season.total_watch_time > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getDurationText(season.total_watch_time)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/10"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                                >
                                  Ver Detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/series/${seriesId}/seasons/${season.id}/edit`}
                                >
                                  Editar Temporada
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
                                >
                                  Adicionar Episódio
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/series/${seriesId}/seasons/${season.id}/episodes/bulk-add`}
                                >
                                  Adicionar Vários Episódios
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            {season.watched_episode_count} de{" "}
                            {season.episode_count} assistidos
                          </span>
                          <span
                            className={`font-semibold ${
                              isComplete
                                ? "text-emerald-600"
                                : progress > 50
                                  ? "text-blue-600"
                                  : "text-amber-600"
                            }`}
                          >
                            {progress}%
                          </span>
                        </div>
                        <Progress
                          value={progress}
                          className={`h-2 ${
                            isComplete
                              ? "bg-emerald-500"
                              : progress > 50
                                ? "bg-blue-500"
                                : "bg-amber-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
