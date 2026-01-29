// components/series/series-header.tsx
"use client";

import { Series } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft,
  Edit,
  Play,
  MoreVertical,
  Star,
  Calendar,
  Tv2,
  Clock
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
    total_watch_time: number;
  };
}

interface SeriesHeaderProps {
  series: SeriesWithStats;
  user: User;
}

export function SeriesHeader({ series, user }: SeriesHeaderProps) {
  const statusColors: Record<string, string> = {
    in_progress: "bg-yellow-500",
    completed: "bg-green-500",
    abandoned: "bg-red-500",
    planned: "bg-blue-500",
  };

  const statusLabels: Record<string, string> = {
    in_progress: "Em Progresso",
    completed: "Completada",
    abandoned: "Abandonada",
    planned: "Planejada",
  };

  return (
    <div className="relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {series.poster_horizontal ? (
          <div className="h-64 md:h-80 w-full relative">
            <Image
              src={series.poster_horizontal}
              alt={series.name || "Série"}
              fill
              className="object-cover opacity-20"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 w-full bg-gradient-to-r from-primary/20 to-secondary/20" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 pt-8">
        <div className="flex items-start gap-6">
          {/* Cover Image */}
          <div className="hidden md:block flex-shrink-0">
            <div className="relative w-48 h-72 rounded-lg overflow-hidden shadow-2xl border-2 border-background">
              {series.cover_image ? (
                <Image
                  src={series.cover_image}
                  alt={series.name || "Série"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 192px"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <Tv2 className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Series Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                <Link href="/series">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Badge className={statusColors[series.status] || "bg-gray-500"}>
                {statusLabels[series.status] || "Desconhecido"}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
              {series.name || "Série sem nome"}
            </h1>

            {series.release_year && (
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {series.release_year}
                </span>
                {series.average_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    {series.average_rating.toFixed(1)}/10
                  </span>
                )}
                {series.total_watch_time > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.round(series.total_watch_time / 60)}h
                  </span>
                )}
              </div>
            )}

            {/* Progress */}
            <div className="mb-6 max-w-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {series.stats.watched_episodes} de {series.stats.total_episodes} episódios
                </span>
                <span className="font-semibold">
                  {series.stats.completion_percentage}% concluído
                </span>
              </div>
              <Progress 
                value={series.stats.completion_percentage} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {series.stats.watched_seasons} de {series.stats.total_seasons} temporadas completas
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/series/${series.id}/watch`}>
                  <Play className="h-4 w-4 mr-2" />
                  Marcar Episódio
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href={`/series/${series.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/series/${series.id}/seasons/new`}>
                      Adicionar Temporada
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/series/${series.id}/cast/new`}>
                      Adicionar Elenco
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/series/${series.id}/content/new`}>
                      Adicionar Conteúdo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Excluir Série
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}