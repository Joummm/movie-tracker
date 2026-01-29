// components/series/series-seasons.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Tv, Calendar, Star, Eye, MoreVertical } from "lucide-react";
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Temporadas</CardTitle>
        <Button size="sm" asChild>
          <Link href={`/series/${seriesId}/seasons/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Temporada
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {sortedSeasons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma temporada adicionada ainda</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/series/${seriesId}/seasons/new`}>
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
                <div
                  key={season.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {/* Season Poster */}
                  <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                    {season.poster_vertical ? (
                      <Image
                        src={season.poster_vertical}
                        alt={season.name || `Temporada ${season.season_number}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <Tv className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Season Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {season.is_special
                              ? "Especial"
                              : `Temporada ${season.season_number}`}
                            {season.name && `: ${season.name}`}
                          </h3>
                          {isComplete && (
                            <Badge variant="default" className="h-5">
                              <Eye className="h-3 w-3 mr-1" />
                              Completa
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
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
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}`}
                            >
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/edit`}
                            >
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
                            >
                              Adicionar Episódio
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          {season.watched_episode_count} de{" "}
                          {season.episode_count} assistidos
                        </span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
