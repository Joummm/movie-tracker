// components/series/seasons-list.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  release_year?: number;
  average_rating?: number;
  total_watch_time: number;
  series_episodes?: Episode[];
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
          season.season_number.toString().includes(query)
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
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  if (seasons.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Tv className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma temporada</h3>
            <p className="text-muted-foreground mb-6">
              Esta série ainda não tem temporadas adicionadas.
            </p>
            <Button asChild>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card/40 backdrop-blur-sm rounded-lg border border-border/30 p-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar temporadas por nome ou número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex rounded-lg border border-border/50 bg-background/50">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 px-3 rounded-r-none border-r"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 px-3 rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter */}
          <Select
            value={filterType}
            onValueChange={(value: any) => setFilterType(value)}
          >
            <SelectTrigger className="w-32.5 bg-background/50 border-border/50">
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
            <SelectTrigger className="w-32.5 bg-background/50 border-border/50">
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{filteredSeasons.length}</span> de{" "}
          <span className="font-medium">{seasons.length}</span> temporadas
          {filterType !== "all" && (
            <span className="ml-2 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              {filterType === "regular" ? "Regulares" : "Especiais"}
            </span>
          )}
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
            className="h-8 text-xs gap-1 hover:bg-primary/10"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredSeasons.length} de {seasons.length} temporadas
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

            return (
              <Card
                key={season.id}
                className="group hover:shadow-lg transition-shadow"
              >
                {/* Season Image */}
                <div className="relative aspect-2/3 overflow-hidden rounded-t-lg bg-muted">
                  {season.poster_vertical ? (
                    <Image
                      src={season.poster_vertical}
                      alt={season.name || `Temporada ${season.season_number}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Tv className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={season.is_special ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {season.is_special
                        ? "Especial"
                        : `T${season.season_number}`}
                    </Badge>
                  </div>

                  <div className="absolute top-2 right-2">
                    {isComplete && (
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Completa
                      </Badge>
                    )}
                  </div>

                  {/* Action Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/series/${seriesId}/seasons/${season.id}`}>
                        Ver Detalhes
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
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                          >
                            Ver Episódios
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => openDeleteDialog(season.id, e)}
                          className="text-destructive focus:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Temporada
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Title */}
                    <div>
                      <h3 className="font-semibold line-clamp-1">
                        {season.is_special
                          ? "Especial"
                          : `Temporada ${season.season_number}`}
                        {season.name && `: ${season.name}`}
                      </h3>

                      {/* Info */}
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
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
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>
                          {season.watched_episode_count}/{season.episode_count}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {progress}%
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {season.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{season.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                        {season.total_watch_time > 0 && (
                          <span>
                            {getDurationText(season.total_watch_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSeasons.map((season) => {
            const progress = calculateProgress(
              season.watched_episode_count,
              season.episode_count,
            );
            const isComplete = progress === 100;

            return (
              <Card
                key={season.id}
                className="hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  {/* Season Image */}
                  <div className="relative w-24 h-32 md:w-32 md:h-40 shrink-0">
                    {season.poster_vertical ? (
                      <Image
                        src={season.poster_vertical}
                        alt={season.name || `Temporada ${season.season_number}`}
                        fill
                        className="object-cover rounded-l-lg"
                        sizes="(max-width: 768px) 100px, 150px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted rounded-l-lg">
                        <Tv className="h-8 w-8 text-muted-foreground" />
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
                              <h3 className="font-semibold text-lg">
                                {season.is_special
                                  ? "Especial"
                                  : `Temporada ${season.season_number}`}
                                {season.name && `: ${season.name}`}
                              </h3>
                              <Badge
                                variant={
                                  season.is_special ? "secondary" : "outline"
                                }
                              >
                                {season.is_special
                                  ? "Especial"
                                  : `T${season.season_number}`}
                              </Badge>
                              {isComplete && (
                                <Badge variant="default" className="h-5">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Completa
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
                                <span>
                                  {getDurationText(season.total_watch_time)}
                                </span>
                              )}
                            </div>
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => openDeleteDialog(season.id, e)}
                                className="text-destructive focus:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Temporada
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
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

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          {season.series_episodes &&
                            season.series_episodes.length > 0 && (
                              <span>
                                {
                                  season.series_episodes.filter(
                                    (e) => e.is_watched,
                                  ).length
                                }{" "}
                                episódios marcados
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}`}
                            >
                              Ver Detalhes
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/series/${seriesId}/seasons/${season.id}/episodes`}
                            >
                              Episódios
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Temporada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta temporada?
              <br />
              <span className="text-destructive font-medium">
                Esta ação não pode ser desfeita.
              </span>
              <br />
              <br />
              <span className="text-muted-foreground">
                • Todos os episódios serão permanentemente removidos
                <br />• Estatísticas da série serão recalculadas
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeason}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
