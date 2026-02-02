// components/movies/MovieCard.tsx
"use client";

import { useState } from "react";
import { MovieWithStats } from "@/lib/types/movies";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Clock,
  Calendar,
  Film,
  MoreVertical,
  Eye,
  Pencil,
  Play,
  Check,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: MovieWithStats;
  viewMode: "grid" | "list";
  user: SupabaseUser;
}

export function MovieCard({ movie, viewMode, user }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Verifica se o movie.id é válido
  const movieId = movie.id;
  if (!movieId) {
    console.error("Movie ID is undefined", movie);
    return null;
  }

  const statusColors = {
    completed: "bg-emerald-500",
    watching: "bg-blue-500",
    planned: "bg-amber-500",
    rewatching: "bg-purple-500",
    abandoned: "bg-rose-500",
  };

  const statusLabels = {
    completed: "Assistido",
    watching: "Assistindo",
    planned: "Planejado",
    rewatching: "Reassistindo",
    abandoned: "Abandonado",
  };

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Calcular tempo desde a última visualização - CORRIGIDO: verificar se stats existe
  const getTimeSinceWatch = () => {
    if (!movie.stats?.last_watched) return null;

    const lastWatched = new Date(movie.stats.last_watched);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastWatched.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  if (viewMode === "list") {
    return (
      <Link
        href={`/movies/${movieId}`}
        className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Poster */}
        <div className="relative h-24 w-16 shrink-0 rounded-lg overflow-hidden">
          {movie.cover_image && !imageError ? (
            <img
              src={movie.cover_image}
              alt={movie.name || "Filme"}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {/* Status Badge */}
          <div
            className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
              statusColors[movie.watch_status as keyof typeof statusColors] ||
              "bg-gray-500"
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg truncate group-hover:text-emerald-500 transition-colors">
                {movie.name || "Filme sem nome"}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {movie.release_year && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {movie.release_year}
                  </span>
                )}
                {movie.duration && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {movie.duration}m
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Rating */}
              {movie.rating && movie.rating > 0 && (
                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-yellow-700">
                    {movie.rating.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/movies/${movieId}`}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/movies/${movieId}/edit`}
                      className="cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-4 mt-3">
            {/* Status */}
            <Badge variant="outline" className="gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  statusColors[
                    movie.watch_status as keyof typeof statusColors
                  ] || "bg-gray-500"
                }`}
              />
              {statusLabels[movie.watch_status as keyof typeof statusLabels] ||
                "Desconhecido"}
            </Badge>

            {/* Last watched - CORRIGIDO: verificar se stats existe */}
            {movie.stats?.last_watched && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Assistido {getTimeSinceWatch()}
              </span>
            )}

            {/* Rewatch count - CORRIGIDO: verificar se stats existe */}
            {movie.stats?.rewatch_count && movie.stats.rewatch_count > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Play className="h-3 w-3" />
                {movie.stats.rewatch_count}x reassistido
              </Badge>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid View
  return (
    <div
      className="group relative overflow-hidden rounded-xl border bg-card transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster */}
      <Link href={`/movies/${movieId}`}>
        <div className="relative aspect-2/3 overflow-hidden bg-muted">
          {movie.cover_image && !imageError ? (
            <img
              src={movie.cover_image}
              alt={movie.name || "Filme"}
              className={cn(
                "h-full w-full object-cover transition-all duration-700",
                isHovered && "scale-110",
              )}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Film className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status indicator */}
          <div
            className={`absolute top-3 left-3 h-3 w-3 rounded-full border-2 border-background ${
              statusColors[movie.watch_status as keyof typeof statusColors] ||
              "bg-gray-500"
            }`}
          />

          {/* Quick actions overlay */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
              >
                {movie.watch_status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black via-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-white line-clamp-2">
                {movie.name || "Filme sem nome"}
              </h3>
              <div className="flex items-center gap-3 text-sm text-white/80">
                {movie.release_year && <span>{movie.release_year}</span>}
                {movie.duration && <span>• {movie.duration}m</span>}
              </div>
              {movie.rating && movie.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-white">
                    {movie.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/movies/${movieId}`}>
              <h3 className="font-semibold truncate group-hover:text-emerald-500 transition-colors">
                {movie.name || "Filme sem nome"}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {movie.release_year && (
                <span className="text-sm text-muted-foreground">
                  {movie.release_year}
                </span>
              )}
            </div>
          </div>

          {movie.rating && movie.rating > 0 && (
            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-sm text-yellow-700">
                {movie.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn(
              "gap-1 capitalize",
              movie.watch_status === "completed" &&
                "border-emerald-200 text-emerald-700 bg-emerald-50",
              movie.watch_status === "watching" &&
                "border-blue-200 text-blue-700 bg-blue-50",
              movie.watch_status === "planned" &&
                "border-amber-200 text-amber-700 bg-amber-50",
              movie.watch_status === "rewatching" &&
                "border-purple-200 text-purple-700 bg-purple-50",
              movie.watch_status === "abandoned" &&
                "border-rose-200 text-rose-700 bg-rose-50",
            )}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                statusColors[movie.watch_status as keyof typeof statusColors] ||
                "bg-gray-500"
              }`}
            />
            {statusLabels[movie.watch_status as keyof typeof statusLabels] ||
              "Desconhecido"}
          </Badge>

          {movie.duration && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {movie.duration}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
