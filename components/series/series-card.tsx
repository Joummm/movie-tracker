// components/series/series-card.tsx
"use client";

import { Series } from "@/lib/types/database";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MoreVertical, 
  Play, 
  CheckCircle2, 
  Calendar,
  Tv2,
  Star
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

interface SeriesWithStats extends Series {
  stats: {
    total_episodes: number;
    watched_episodes: number;
    total_seasons: number;
    watched_seasons: number;
    completion_percentage: number;
    average_rating?: number;
  };
}

interface SeriesCardProps {
  series: SeriesWithStats;
  viewMode: "grid" | "list";
  user: User;
}

export function SeriesCard({ series, viewMode, user }: SeriesCardProps) {
  const statusColors = {
    in_progress: "bg-yellow-500",
    completed: "bg-green-500",
    abandoned: "bg-red-500",
    planned: "bg-blue-500",
  };

  const statusLabels = {
    in_progress: "Em Progresso",
    completed: "Completada",
    abandoned: "Abandonada",
    planned: "Planejada",
  };

  if (viewMode === "grid") {
    return (
      <Card className="group hover:shadow-lg transition-shadow">
        <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg bg-muted">
          {series.cover_image ? (
            <Image
              src={series.cover_image}
              alt={series.name || "Série"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Tv2 className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              className={`${statusColors[series.status]} text-white border-none`}
            >
              {statusLabels[series.status]}
            </Badge>
          </div>

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/series/${series.id}`}>
                <Play className="h-4 w-4 mr-1" />
                Ver Série
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/series/${series.id}/edit`}>Editar</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/series/${series.id}/seasons`}>Ver Temporadas</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/series/${series.id}/cast`}>Elenco</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold line-clamp-1">{series.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {series.description || "Sem descrição"}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{series.stats.watched_episodes}/{series.stats.total_episodes} episódios</span>
              </div>
              <Progress value={series.stats.completion_percentage} className="h-2" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{series.stats.watched_seasons}/{series.stats.total_seasons} temporadas</span>
                <span>{series.stats.completion_percentage}%</span>
              </div>
            </div>

            {/* Info Row */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {series.release_year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{series.release_year}</span>
                  </div>
                )}
                {series.stats.average_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{series.stats.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {series.total_watch_time > 0 && (
                <span>
                  {Math.round(series.total_watch_time / 60)}h
                </span>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/series/${series.id}/watch`}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar Episódio
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // List View
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Cover Image */}
        <div className="relative w-24 h-32 md:w-32 md:h-40 flex-shrink-0">
          {series.cover_image ? (
            <Image
              src={series.cover_image}
              alt={series.name || "Série"}
              fill
              className="object-cover rounded-l-lg"
              sizes="(max-width: 768px) 100px, 150px"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted rounded-l-lg">
              <Tv2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{series.name}</h3>
                    <Badge 
                      className={`${statusColors[series.status]} text-white border-none`}
                    >
                      {statusLabels[series.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {series.description || "Sem descrição"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/series/${series.id}`}>Ver Série</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/series/${series.id}/edit`}>Editar</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/series/${series.id}/seasons`}>Temporadas</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress and Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="font-semibold">
                    {series.stats.watched_episodes}/{series.stats.total_episodes}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temporadas</p>
                  <p className="font-semibold">
                    {series.stats.watched_seasons}/{series.stats.total_seasons}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avaliação</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {series.stats.average_rating?.toFixed(1) || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Total</p>
                  <p className="font-semibold">
                    {series.total_watch_time > 0 
                      ? `${Math.round(series.total_watch_time / 60)}h`
                      : "-"
                    }
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Completado</span>
                  <span>{series.stats.completion_percentage}%</span>
                </div>
                <Progress value={series.stats.completion_percentage} className="h-2" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                {series.release_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {series.release_year}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" asChild>
                  <Link href={`/series/${series.id}`}>
                    Ver Detalhes
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/series/${series.id}/watch`}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Marcar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}