// components/series/series-header.tsx (versão atualizada)
"use client";

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
  Clock,
  TrendingUp,
  Eye,
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
import { cn } from "@/lib/utils";

interface SeriesWithStats {
  id: string;
  name?: string;
  cover_image?: string;
  poster_horizontal?: string;
  release_year?: number;
  status: string;
  description?: string;
  stats: {
    total_episodes: number;
    watched_episodes: number;
    total_seasons: number;
    watched_seasons: number;
    completion_percentage: number;
    average_rating?: number;
    total_watch_hours: number;
  };
}

interface SeriesHeaderProps {
  series: SeriesWithStats;
  user: User;
}

export function SeriesHeader({ series, user }: SeriesHeaderProps) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    in_progress: { color: "bg-blue-500", label: "Em Progresso" },
    completed: { color: "bg-emerald-500", label: "Completada" },
    abandoned: { color: "bg-rose-500", label: "Abandonada" },
    planned: { color: "bg-purple-500", label: "Planejada" },
  };

  const status = statusConfig[series.status] || { color: "bg-gray-500", label: "Desconhecido" };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-card to-card/80 border border-border/50 shadow-xl">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {series.poster_horizontal ? (
          <div className="h-full w-full relative">
            <Image
              src={series.poster_horizontal}
              alt={series.name || "Série"}
              fill
              className="object-cover opacity-10"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-card via-card/90 to-transparent" />
          </div>
        ) : (
          <div className="h-full w-full bg-linear-to-br from-primary/10 to-secondary/10" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="shrink-0">
            <div className="relative w-48 h-64 md:w-56 md:h-80 rounded-xl overflow-hidden shadow-2xl border-4 border-background/80">
              {series.cover_image ? (
                <Image
                  src={series.cover_image}
                  alt={series.name || "Série"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 224px"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-linear-to-br from-muted to-muted/50">
                  <Tv2 className="h-16 w-16 text-muted-foreground/70" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-primary/20 via-transparent to-transparent" />
            </div>
          </div>

          {/* Series Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col h-full">
              {/* Header with back button and status */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 w-9 p-0 rounded-full hover:bg-primary/10"
                >
                  <Link href="/series">
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                
                <div className="flex items-center gap-3">
                  <Badge 
                    className={cn(
                      "border-none text-white shadow-md px-3 py-1.5",
                      status.color
                    )}
                  >
                    {status.label}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/series/${series.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Série
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/series/${series.id}/seasons/new`}>
                          <Tv2 className="h-4 w-4 mr-2" />
                          Nova Temporada
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Excluir Série
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Title and basic info */}
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {series.name || "Série sem nome"}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {series.release_year && (
                    <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{series.release_year}</span>
                    </div>
                  )}
                  
                  {series.stats.average_rating && series.stats.average_rating > 0 && (
                    <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="font-medium">
                        {series.stats.average_rating.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{series.stats.total_watch_hours}h</span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">Progresso Geral</span>
                  </div>
                  <span className="font-semibold text-primary">
                    {series.stats.completion_percentage}%
                  </span>
                </div>
                
                <Progress
                  value={series.stats.completion_percentage}
                  className="h-2.5 bg-muted/50"
                />
                
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>
                    {series.stats.watched_episodes} de {series.stats.total_episodes} episódios
                  </span>
                  <span>
                    {series.stats.watched_seasons} de {series.stats.total_seasons} temporadas
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Episódios</p>
                  <p className="text-2xl font-bold">{series.stats.total_episodes}</p>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Assistidos</p>
                  <p className="text-2xl font-bold text-primary">
                    {series.stats.watched_episodes}
                  </p>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Temporadas</p>
                  <p className="text-2xl font-bold">{series.stats.total_seasons}</p>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Horas</p>
                  <p className="text-2xl font-bold">{series.stats.total_watch_hours}h</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-border/30">
                <Button asChild className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  <Link href={`/series/${series.id}/watch`}>
                    <Play className="h-4 w-4" />
                    Marcar Episódio
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="gap-2">
                  <Link href={`/series/${series.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                
                <Button variant="ghost" asChild className="gap-2">
                  <Link href={`/series/${series.id}/seasons`}>
                    <Eye className="h-4 w-4" />
                    Ver Todas Temporadas
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}