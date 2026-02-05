// components/series/seasons-list.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Tv,
  Calendar,
  Star,
  Eye,
  MoreVertical,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  PlayCircle,
  Clock,
  Check,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Users,
  Film,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Episode {
  id: string;
  episode_number: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  rating?: number;
}

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
  series_episodes?: Episode[];
  special_type?: string;
}

interface SeasonsListProps {
  seasons: Season[];
  seriesId: string;
  seriesName: string;
  userId?: string;
}

export function SeasonsList({
  seasons,
  seriesId,
  seriesName,
  userId,
}: SeasonsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "regular" | "special">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "number" | "progress" | "rating" | "episodes"
  >("number");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredSeason, setHoveredSeason] = useState<string | null>(null);

  // Função para deletar temporada
  const handleDeleteSeason = async () => {
    if (!seasonToDelete || !userId) return;

    setIsDeleting(true);
    const supabase = createClient();

    try {
      // Primeiro, deletar episódios relacionados
      const { error: episodesError } = await supabase
        .from("series_episodes")
        .delete()
        .eq("season_id", seasonToDelete);

      if (episodesError) throw episodesError;

      // Deletar a temporada
      const { error } = await supabase
        .from("series_seasons")
        .delete()
        .eq("id", seasonToDelete)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Temporada excluída com sucesso", {
        description: "A temporada e seus episódios foram removidos.",
      });

      // Atualizar a página
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir temporada:", error);
      toast.error("Erro ao excluir temporada", {
        description: "Não foi possível excluir a temporada. Tente novamente.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSeasonToDelete(null);
    }
  };

  // Função para abrir o diálogo de confirmação
  const openDeleteDialog = (seasonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSeasonToDelete(seasonId);
    setShowDeleteDialog(true);
  };

  // Filter and sort seasons
  const filteredSeasons = seasons
    .filter((season) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          season.name?.toLowerCase().includes(query) ||
          season.season_number.toString().includes(query) ||
          (season.special_type?.toLowerCase().includes(query) ?? false)
        );
      }

      // Type filter
      if (filterType === "regular" && season.is_special) return false;
      if (filterType === "special" && !season.is_special) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "progress":
          const progressA =
            a.episode_count > 0
              ? (a.watched_episode_count / a.episode_count) * 100
              : 0;
          const progressB =
            b.episode_count > 0
              ? (b.watched_episode_count / b.episode_count) * 100
              : 0;
          return progressB - progressA;
        case "rating":
          const ratingA = a.average_rating || 0;
          const ratingB = b.average_rating || 0;
          return ratingB - ratingA;
        case "episodes":
          return b.episode_count - a.episode_count;
        case "number":
        default:
          return a.season_number - b.season_number;
      }
    });

  const calculateProgress = (watched: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((watched / total) * 100);
  };

  const getDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-emerald-500";
    if (rating >= 6) return "text-amber-500";
    if (rating >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getProgressColorClass = (progress: number) => {
    if (progress === 100) return "bg-emerald-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getSpecialTypeColor = (specialType?: string) => {
    switch (specialType?.toLowerCase()) {
      case "christmas":
        return "bg-red-100 text-red-700 border-red-200";
      case "halloween":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "anniversary":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "finale":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  // Componente Progress personalizado
  const CustomProgress = ({
    value,
    className = "",
  }: {
    value: number;
    className?: string;
  }) => {
    const colorClass = getProgressColorClass(value);
    return (
      <div
        className={`h-2.5 bg-muted/50 rounded-full overflow-hidden ${className}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    );
  };

  if (seasons.length === 0) {
    return (
      <Card className="border-2 border-dashed border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardContent className="py-16">
          <div className="text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 bg-linear-to-r from-primary to-blue-600 rounded-full blur-xl opacity-30"></div>
              <div className="relative p-4 rounded-full bg-linear-to-br from-primary/20 to-blue-600/20 border border-primary/20">
                <Film className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Nenhuma temporada encontrada
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece adicionando temporadas para organizar seus episódios e
              acompanhar seu progresso.
            </p>
            <Button
              asChild
              className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg transition-all"
            >
              <Link href={`/series/${seriesId}/seasons/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Temporada
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-linear-to-br from-card/50 to-card/80 backdrop-blur-sm rounded-xl border border-border/30 p-4 shadow-sm">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar temporadas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex rounded-lg border border-border/50 bg-background/50 overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 px-3 rounded-none border-r bg-linear-to-r from-primary/5 to-primary/0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 px-3 rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter */}
          <Select
            value={filterType}
            onValueChange={(value: any) => setFilterType(value)}
          >
            <SelectTrigger className="w-32 bg-background/50 border-border/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="regular">Regulares</SelectItem>
              <SelectItem value="special">Especiais</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-32 bg-background/50 border-border/50">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="progress">Progresso</SelectItem>
              <SelectItem value="rating">Avaliação</SelectItem>
              <SelectItem value="episodes">Episódios</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-primary/5 to-blue-500/5 border border-primary/10 rounded-xl p-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-1">
            Resultados encontrados
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{filteredSeasons.length}</span>
            <span className="text-muted-foreground">de</span>
            <span className="text-2xl font-bold">{seasons.length}</span>
            <span className="text-muted-foreground">temporadas</span>
            {filterType !== "all" && (
              <Badge variant="outline" className="ml-2">
                {filterType === "regular" ? "📺 Regulares" : "✨ Especiais"}
              </Badge>
            )}
          </div>
        </div>

        {(searchQuery || filterType !== "all" || sortBy !== "number") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterType("all");
              setSortBy("number");
            }}
            className="h-8 text-xs gap-2 hover:bg-primary/10 hover:text-primary"
          >
            <span>Limpar Filtros</span>
          </Button>
        )}
      </div>

      {/* Seasons Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeasons.map((season) => {
            const progress = calculateProgress(
              season.watched_episode_count,
              season.episode_count,
            );
            const isComplete = progress === 100;
            const hasEpisodes =
              season.series_episodes && season.series_episodes.length > 0;
            const watchedEpisodes =
              season.series_episodes?.filter((e) => e.is_watched).length || 0;
            const averageEpisodeDuration = hasEpisodes
              ? season.series_episodes!.reduce(
                  (acc, e) => acc + (e.duration || 0),
                  0,
                ) / season.series_episodes!.length
              : 0;

            return (
              <div
                key={season.id}
                className="group relative"
                onMouseEnter={() => setHoveredSeason(season.id)}
                onMouseLeave={() => setHoveredSeason(null)}
              >
                <div className="h-full overflow-hidden border border-border/40 bg-linear-to-br from-card to-card/80 backdrop-blur-sm rounded-lg transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:scale-[1.02]">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Season Image with gradient */}
                  <div
                    className="relative aspect-3/4 overflow-hidden cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/series/${seriesId}/seasons/${season.id}/episodes`,
                      )
                    }
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-blue-600/10 z-10" />
                    {season.poster_vertical ? (
                      <Image
                        src={season.poster_vertical}
                        alt={season.name || `Temporada ${season.season_number}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-linear-to-br from-primary/5 to-blue-600/5">
                        <div className="text-center p-6">
                          <div className="relative inline-flex mb-4">
                            <div className="absolute inset-0 bg-linear-to-r from-primary to-blue-600 rounded-full blur-xl opacity-30"></div>
                            <div className="relative p-3 rounded-full bg-linear-to-br from-primary/20 to-blue-600/20 border border-primary/20">
                              <Tv className="h-8 w-8 text-primary" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {season.is_special
                              ? "Especial"
                              : `T${season.season_number}`}
                          </h3>
                        </div>
                      </div>
                    )}

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                      <Badge
                        className={`gap-1.5 font-medium ${
                          season.is_special
                            ? getSpecialTypeColor(season.special_type)
                            : "bg-linear-to-r from-primary to-blue-600 text-white border-0"
                        }`}
                      >
                        {season.is_special ? (
                          <>
                            <Sparkles className="h-3 w-3" />
                            {season.special_type || "Especial"}
                          </>
                        ) : (
                          <>
                            <Film className="h-3 w-3" />T{season.season_number}
                          </>
                        )}
                      </Badge>

                      {isComplete && (
                        <Badge className="gap-1.5 bg-linear-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm">
                          <Check className="h-3 w-3" />
                          Completa
                        </Badge>
                      )}
                    </div>

                    {/* Quick stats overlay */}
                    <div className="absolute top-3 right-3 z-20">
                      {season.average_rating && (
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm ${getRatingColor(season.average_rating)}`}
                        >
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-sm font-bold">
                            {season.average_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover overlay with actions - AGORA FORA do elemento clicável */}
                  <div
                    className={`absolute inset-0 flex items-end justify-center p-4 transition-all duration-300 ${
                      hoveredSeason === season.id ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
                      pointerEvents:
                        hoveredSeason === season.id ? "auto" : "none",
                    }}
                  >
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="text-center mb-2">
                        <h4 className="text-white font-semibold text-lg mb-1">
                          {season.name || `Temporada ${season.season_number}`}
                        </h4>
                        <p className="text-white/80 text-sm">
                          {season.episode_count} episódios
                        </p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          className="flex-1 gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                          asChild
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/series/${seriesId}/seasons/${season.id}/episodes`,
                            );
                          }}
                        >
                          <div>
                            <PlayCircle className="h-4 w-4" />
                            Assistir
                          </div>
                        </Button>
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 bg-black/50 hover:bg-black/70 text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Episódios
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
                                  <Plus className="h-4 w-4 mr-2" />
                                  Novo Episódio
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => openDeleteDialog(season.id, e)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-lg line-clamp-1 mb-2">
                          {season.is_special
                            ? season.special_type || "Especial"
                            : `Temporada ${season.season_number}`}
                          {season.name && (
                            <span className="text-muted-foreground block text-sm font-normal mt-1">
                              {season.name}
                            </span>
                          )}
                        </h3>

                        {/* Stats row */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Tv className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {season.episode_count}
                              </span>
                            </span>
                            {season.release_year && (
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {season.release_year}
                              </span>
                            )}
                            {averageEpisodeDuration > 0 && (
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {getDurationText(averageEpisodeDuration)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Progresso</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {season.watched_episode_count}/
                              {season.episode_count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({progress}%)
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <CustomProgress value={progress} />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{watchedEpisodes} assistidos</span>
                            <span>
                              {season.episode_count - watchedEpisodes} restantes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom stats */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <div className="flex items-center gap-3">
                          {season.average_rating && (
                            <div
                              className={`flex items-center gap-1.5 ${getRatingColor(season.average_rating)}`}
                            >
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-bold">
                                {season.average_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {season.total_watch_time > 0 && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">
                                {getDurationText(season.total_watch_time)}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 h-8 hover:bg-primary/10 hover:text-primary"
                          asChild
                        >
                          <Link
                            href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                          >
                            Detalhes
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {filteredSeasons.map((season) => {
            const progress = calculateProgress(
              season.watched_episode_count,
              season.episode_count,
            );
            const isComplete = progress === 100;

            return (
              <div
                key={season.id}
                className="group hover:shadow-lg transition-all duration-300 hover:border-primary/20 overflow-hidden border border-border/30 rounded-lg bg-linear-to-br from-card to-card/80 backdrop-blur-sm"
              >
                <div className="flex">
                  {/* Season Image */}
                  <div
                    className="relative w-32 h-44 md:w-36 md:h-48 shrink-0 overflow-hidden cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/series/${seriesId}/seasons/${season.id}/episodes`,
                      )
                    }
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-blue-600/10 z-10" />
                    {season.poster_horizontal ? (
                      <Image
                        src={season.poster_horizontal}
                        alt={season.name || `Temporada ${season.season_number}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 150px, 200px"
                      />
                    ) : season.poster_vertical ? (
                      <Image
                        src={season.poster_vertical}
                        alt={season.name || `Temporada ${season.season_number}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 150px, 200px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-linear-to-br from-primary/5 to-blue-600/5">
                        <Tv className="h-12 w-12 text-primary/50" />
                      </div>
                    )}
                  </div>

                  {/* Content - NÃO CLICÁVEL, apenas os botões são */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                className={`gap-1.5 ${
                                  season.is_special
                                    ? getSpecialTypeColor(season.special_type)
                                    : "bg-linear-to-r from-primary to-blue-600 text-white"
                                }`}
                              >
                                {season.is_special ? (
                                  <>
                                    <Sparkles className="h-3 w-3" />
                                    {season.special_type || "Especial"}
                                  </>
                                ) : (
                                  `T${season.season_number}`
                                )}
                              </Badge>
                              {isComplete && (
                                <Badge
                                  variant="outline"
                                  className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                >
                                  <Check className="h-3 w-3" />
                                  Completa
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-xl font-bold mb-2">
                              {season.is_special
                                ? season.special_type || "Especial"
                                : `Temporada ${season.season_number}`}
                              {season.name && (
                                <span className="text-muted-foreground font-normal ml-2">
                                  {season.name}
                                </span>
                              )}
                            </h3>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1.5">
                                <Tv className="h-3.5 w-3.5" />
                                {season.episode_count} episódios
                              </span>
                              {season.release_year && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {season.release_year}
                                </span>
                              )}
                              {season.average_rating && (
                                <span
                                  className={`flex items-center gap-1.5 ${getRatingColor(season.average_rating)}`}
                                >
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  {season.average_rating.toFixed(1)}
                                </span>
                              )}
                              {season.total_watch_time > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {getDurationText(season.total_watch_time)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                                  >
                                    Ver Episódios
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    openDeleteDialog(season.id, e)
                                  }
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir Temporada
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <div className="flex items-center gap-2">
                              <span>Progresso</span>
                              <span className="font-bold">{progress}%</span>
                            </div>
                            <span className="text-muted-foreground">
                              {season.watched_episode_count}/
                              {season.episode_count}
                            </span>
                          </div>
                          <CustomProgress value={progress} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <div className="text-sm text-muted-foreground">
                          {season.series_episodes &&
                            season.series_episodes.length > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                <span>
                                  {
                                    season.series_episodes.filter(
                                      (e) => e.is_watched,
                                    ).length
                                  }{" "}
                                  episódios marcados
                                </span>
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="gap-2"
                          >
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                            >
                              Ver Episódios
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            asChild
                            className="gap-2 bg-linear-to-r from-primary to-blue-600"
                          >
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                            >
                              <PlayCircle className="h-4 w-4" />
                              Assistir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-2 border-destructive/20">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle>Excluir Temporada</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>Tem certeza que deseja excluir esta temporada?</p>
              <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3">
                <p className="text-destructive font-medium">
                  Esta ação não pode ser desfeita.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Trash2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Todos os episódios serão permanentemente removidos
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Estatísticas da série serão recalculadas
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Progresso será perdido
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-border/50"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeason}
              disabled={isDeleting}
              className="bg-linear-to-r from-destructive to-red-600 text-destructive-foreground hover:from-destructive/90 hover:to-red-600/90 shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Temporada
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
