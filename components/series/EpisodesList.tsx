// components/series/EpisodesList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  Tv,
  Eye,
  EyeOff,
  Star,
  Calendar,
  Clock,
  MoreVertical,
  ArrowLeft,
  CheckCircle2,
  Play,
  Edit,
  Trash2,
  Layers,
  ChevronRight,
  BarChart3,
  Pencil,
  AlertCircle,
  CheckCheck,
  MessageSquare,
  X,
  ChartBar,
  Target,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
  content_id?: string;
  content?: {
    id: string;
    name?: string;
    rating?: number;
    watched_date?: string;
    watched_year?: number;
    watched_month?: number;
    watched_day?: number;
    date_unknown?: boolean;
    date_precision?: string;
    review?: string; // Adicionado aqui
  };
}

interface Season {
  id: string;
  season_number: number;
  name?: string;
  is_special: boolean;
  episode_count: number;
  watched_episode_count: number;
  average_rating?: number;
  total_watch_time: number;
  release_year?: number;
  description?: string;
  poster_vertical?: string;
  poster_horizontal?: string;
  special_type?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("episodes");

  // Estados para os diálogos
  const [markAllDialogOpen, setMarkAllDialogOpen] = useState(false);
  const [watchStatusDialogOpen, setWatchStatusDialogOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isMarkingAsWatched, setIsMarkingAsWatched] = useState(true);
  const [watchDate, setWatchDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [watchRating, setWatchRating] = useState<string>("");
  const [watchReview, setWatchReview] = useState("");

  // Estados para estatísticas em tempo real
  const [currentStats, setCurrentStats] = useState(stats);
  const [currentEpisodes, setCurrentEpisodes] = useState(episodes);

  // Atualizar estatísticas quando os episódios mudarem
  useEffect(() => {
    const totalEpisodes = currentEpisodes.length;
    const watchedEpisodes = currentEpisodes.filter(
      (ep) => ep.is_watched,
    ).length;
    const completionPercentage =
      totalEpisodes > 0
        ? Math.round((watchedEpisodes / totalEpisodes) * 100)
        : 0;

    // Calcular nota média apenas dos episódios avaliados
    const ratedEpisodes = currentEpisodes.filter(
      (ep) => ep.rating && ep.rating > 0,
    );
    const averageRating =
      ratedEpisodes.length > 0
        ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
          ratedEpisodes.length
        : 0;

    // Calcular tempo total
    const totalWatchTime = currentEpisodes.reduce(
      (sum, ep) => sum + (ep.duration || 0),
      0,
    );

    setCurrentStats({
      total_episodes: totalEpisodes,
      watched_episodes: watchedEpisodes,
      completion_percentage: completionPercentage,
      average_rating: averageRating,
      total_watch_time: totalWatchTime,
    });
  }, [currentEpisodes]);

  const filteredEpisodes = currentEpisodes.filter((episode) => {
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

  const formatDuration = (minutes?: number) => {
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
    if (!dateString) return "Não especificada";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: pt });
    } catch {
      return "Data inválida";
    }
  };

  const getEpisodeWatchedDate = (episode: Episode) => {
    // Se houver conteúdo vinculado, usar a data do conteúdo
    if (episode.content?.watched_date) {
      return episode.content.watched_date;
    }
    return undefined;
  };

  const handleMarkAllAsWatched = async () => {
    setIsLoading(true);
    try {
      const unwatchedEpisodes = currentEpisodes.filter((ep) => !ep.is_watched);
      const episodeIds = unwatchedEpisodes.map((ep) => ep.id);

      if (episodeIds.length === 0) {
        toast.info("Todos os episódios já estão assistidos!");
        return;
      }

      // Atualizar todos os episódios - NÃO USAR user_id pois não existe na tabela
      const { error } = await supabase
        .from("series_episodes")
        .update({
          is_watched: true,
          updated_at: new Date().toISOString(),
        })
        .in("id", episodeIds);

      if (error) throw error;

      // Atualizar estado local
      const updatedEpisodes = currentEpisodes.map((ep) => ({
        ...ep,
        is_watched: true,
      }));

      setCurrentEpisodes(updatedEpisodes);

      // Atualizar temporada
      await supabase
        .from("series_seasons")
        .update({
          watched_episode_count: currentEpisodes.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId)
        .eq("user_id", userId);

      toast.success("Todos os episódios marcados como assistidos!", {
        description: `${unwatchedEpisodes.length} episódios atualizados.`,
        duration: 3000,
      });

      setMarkAllDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao marcar todos como assistidos:", error);
      toast.error("Erro ao atualizar", {
        description:
          error.message || "Não foi possível atualizar os episódios.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsUnwatched = async () => {
    setIsLoading(true);
    try {
      const watchedEpisodes = currentEpisodes.filter((ep) => ep.is_watched);
      const episodeIds = watchedEpisodes.map((ep) => ep.id);

      if (episodeIds.length === 0) {
        toast.info("Nenhum episódio está marcado como assistido!");
        return;
      }

      // Atualizar todos os episódios - NÃO USAR user_id
      const { error } = await supabase
        .from("series_episodes")
        .update({
          is_watched: false,
          updated_at: new Date().toISOString(),
        })
        .in("id", episodeIds);

      if (error) throw error;

      // Atualizar estado local
      const updatedEpisodes = currentEpisodes.map((ep) => ({
        ...ep,
        is_watched: false,
      }));

      setCurrentEpisodes(updatedEpisodes);

      // Atualizar temporada
      await supabase
        .from("series_seasons")
        .update({
          watched_episode_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId)
        .eq("user_id", userId);

      toast.success("Todos os episódios marcados como não assistidos!", {
        description: `${watchedEpisodes.length} episódios atualizados.`,
        duration: 3000,
      });

      setMarkAllDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao marcar todos como não assistidos:", error);
      toast.error("Erro ao atualizar", {
        description:
          error.message || "Não foi possível atualizar os episódios.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openWatchStatusDialog = (episode: Episode, markAsWatched: boolean) => {
    setSelectedEpisode(episode);
    setIsMarkingAsWatched(markAsWatched);
    setWatchDate(format(new Date(), "yyyy-MM-dd"));
    setWatchRating(episode.rating?.toString() || "");
    setWatchReview(episode.review || "");
    setWatchStatusDialogOpen(true);
  };

  const handleWatchStatusUpdate = async () => {
    if (!selectedEpisode) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        is_watched: isMarkingAsWatched,
        updated_at: new Date().toISOString(),
      };

      if (isMarkingAsWatched) {
        // Se estamos marcando como assistido, atualizar rating e review se fornecidos
        if (watchRating && !isNaN(parseFloat(watchRating))) {
          updateData.rating = parseFloat(watchRating);
        }
        if (watchReview) {
          updateData.review = watchReview;
        }
      } else {
        // Se estamos marcando como não assistido, limpar rating e review
        updateData.rating = null;
        updateData.review = null;
      }

      console.log("Atualizando episódio com dados:", updateData);

      // IMPORTANTE: series_episodes NÃO TEM user_id, usar series_id e season_id para garantir segurança
      const { error } = await supabase
        .from("series_episodes")
        .update(updateData)
        .eq("id", selectedEpisode.id)
        .eq("series_id", seriesId) // Usar series_id em vez de user_id
        .eq("season_id", seasonId); // Usar season_id em vez de user_id

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        throw new Error(error.message || "Erro ao atualizar episódio");
      }

      // Se houver conteúdo vinculado, também atualizá-lo
      if (selectedEpisode.content_id && isMarkingAsWatched) {
        const contentUpdateData: any = {
          watch_status: "completed",
          updated_at: new Date().toISOString(),
        };

        // Adicionar data de visualização se fornecida
        if (watchDate) {
          contentUpdateData.watched_date = watchDate;
          const date = new Date(watchDate);
          contentUpdateData.watched_year = date.getFullYear();
          contentUpdateData.watched_month = date.getMonth() + 1;
          contentUpdateData.watched_day = date.getDate();
        }

        if (watchRating && !isNaN(parseFloat(watchRating))) {
          contentUpdateData.rating = parseFloat(watchRating);
        }
        if (watchReview) {
          contentUpdateData.review = watchReview;
        }

        const { error: contentError } = await supabase
          .from("content")
          .update(contentUpdateData)
          .eq("id", selectedEpisode.content_id)
          .eq("user_id", userId); // content TEM user_id

        if (contentError) {
          console.error("Erro ao atualizar conteúdo:", contentError);
          // Continuar mesmo se o conteúdo não for atualizado
        }
      }

      // Atualizar estado local
      const updatedEpisodes = currentEpisodes.map((ep) => {
        if (ep.id === selectedEpisode.id) {
          const updatedEpisode = {
            ...ep,
            is_watched: isMarkingAsWatched,
            rating:
              watchRating && !isNaN(parseFloat(watchRating))
                ? parseFloat(watchRating)
                : undefined,
            review: watchReview || undefined,
          };

          // Atualizar conteúdo se existir
          if (ep.content && isMarkingAsWatched && watchDate) {
            updatedEpisode.content = {
              ...ep.content,
              watched_date: watchDate,
              rating:
                watchRating && !isNaN(parseFloat(watchRating))
                  ? parseFloat(watchRating)
                  : ep.content.rating,
              review: watchReview || ep.content.review,
            };
          } else if (ep.content && !isMarkingAsWatched) {
            updatedEpisode.content = {
              ...ep.content,
              watched_date: undefined,
              rating: undefined,
              review: undefined,
            };
          }

          return updatedEpisode;
        }
        return ep;
      });

      setCurrentEpisodes(updatedEpisodes);

      // Atualizar temporada
      const watchedCount = updatedEpisodes.filter((ep) => ep.is_watched).length;
      const totalWatchTime = updatedEpisodes.reduce(
        (sum, ep) => sum + (ep.duration || 0),
        0,
      );

      // Calcular média de avaliação
      const ratedEpisodes = updatedEpisodes.filter(
        (ep) => ep.rating && ep.rating > 0,
      );
      const averageRating =
        ratedEpisodes.length > 0
          ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
            ratedEpisodes.length
          : null;

      const { error: seasonError } = await supabase
        .from("series_seasons")
        .update({
          watched_episode_count: watchedCount,
          average_rating: averageRating,
          total_watch_time: totalWatchTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId)
        .eq("user_id", userId); // series_seasons TEM user_id

      if (seasonError) {
        console.error("Erro ao atualizar temporada:", seasonError);
        // Continuar mesmo se a temporada não for atualizada
      }

      toast.success(
        isMarkingAsWatched
          ? "Episódio marcado como assistido!"
          : "Episódio marcado como não assistido!",
        {
          description: `Episódio ${selectedEpisode.episode_number} atualizado.`,
          duration: 3000,
        },
      );

      setWatchStatusDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao atualizar status do episódio:", error);
      toast.error("Erro ao atualizar", {
        description: error.message || "Não foi possível atualizar o episódio.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (episodeId: string) => {
    if (!confirm("Tem certeza que deseja excluir este episódio?")) {
      return;
    }

    setIsDeleting(episodeId);
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("series_episodes")
        .delete()
        .eq("id", episodeId)
        .eq("series_id", seriesId) // Usar series_id em vez de user_id
        .eq("season_id", seasonId); // Usar season_id em vez de user_id

      if (error) throw error;

      // Atualizar estado local
      const updatedEpisodes = currentEpisodes.filter(
        (ep) => ep.id !== episodeId,
      );
      setCurrentEpisodes(updatedEpisodes);

      // Atualizar temporada
      const watchedCount = updatedEpisodes.filter((ep) => ep.is_watched).length;
      const totalWatchTime = updatedEpisodes.reduce(
        (sum, ep) => sum + (ep.duration || 0),
        0,
      );

      await supabase
        .from("series_seasons")
        .update({
          episode_count: updatedEpisodes.length,
          watched_episode_count: watchedCount,
          total_watch_time: totalWatchTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId)
        .eq("user_id", userId);

      toast.success("Episódio excluído com sucesso!", {
        duration: 3000,
      });

      router.refresh();
    } catch (error: any) {
      console.error("Erro ao excluir episódio:", error);
      toast.error("Erro ao excluir", {
        description: error.message || "Não foi possível excluir o episódio.",
        duration: 4000,
      });
    } finally {
      setIsDeleting(null);
      setIsLoading(false);
    }
  };

  // Calcular estatísticas detalhadas para a tab
  const calculateDetailedStats = () => {
    const totalEpisodes = currentEpisodes.length;
    const watchedEpisodes = currentEpisodes.filter(
      (ep) => ep.is_watched,
    ).length;
    const unwatchedEpisodes = totalEpisodes - watchedEpisodes;

    const ratedEpisodes = currentEpisodes.filter(
      (ep) => ep.rating && ep.rating > 0,
    );
    const averageRating =
      ratedEpisodes.length > 0
        ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
          ratedEpisodes.length
        : 0;

    const totalDuration = currentEpisodes.reduce(
      (sum, ep) => sum + (ep.duration || 0),
      0,
    );
    const averageDuration =
      totalEpisodes > 0 ? Math.round(totalDuration / totalEpisodes) : 0;

    const episodesWithReview = currentEpisodes.filter(
      (ep) => ep.review && ep.review.trim().length > 0,
    ).length;
    const episodesWithRecommendation = currentEpisodes.filter(
      (ep) => ep.would_recommend === true,
    ).length;

    // Distribuição de notas
    const ratingDistribution = Array(11)
      .fill(0)
      .map((_, index) => {
        return currentEpisodes.filter((ep) => ep.rating === index).length;
      });

    // Distribuição por duração
    const shortEpisodes = currentEpisodes.filter(
      (ep) => ep.duration && ep.duration < 30,
    ).length;
    const mediumEpisodes = currentEpisodes.filter(
      (ep) => ep.duration && ep.duration >= 30 && ep.duration <= 45,
    ).length;
    const longEpisodes = currentEpisodes.filter(
      (ep) => ep.duration && ep.duration > 45,
    ).length;

    return {
      totalEpisodes,
      watchedEpisodes,
      unwatchedEpisodes,
      averageRating,
      totalDuration,
      averageDuration,
      episodesWithReview,
      episodesWithRecommendation,
      ratingDistribution,
      shortEpisodes,
      mediumEpisodes,
      longEpisodes,
      completionPercentage:
        totalEpisodes > 0
          ? Math.round((watchedEpisodes / totalEpisodes) * 100)
          : 0,
    };
  };

  const detailedStats = calculateDetailedStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/series/${seriesId}/seasons`)}
            className="h-12 w-12 rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">
              Episódios
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Link
                href={`/series/${seriesId}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {seriesName}
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <Link
                href={`/series/${seriesId}/seasons`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Temporadas
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-semibold text-primary">
                {season.is_special
                  ? "Especial"
                  : `Temporada ${season.season_number}`}
                {season.name && `: ${season.name}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/series/${seriesId}/seasons/${seasonId}/edit`}>
              <Pencil className="h-4 w-4" />
              Editar Temporada
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg"
          >
            <Link
              href={`/series/${seriesId}/seasons/${seasonId}/episodes/bulk-add`}
            >
              <Layers className="h-4 w-4" />
              Adicionar Vários
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-500/90 hover:to-green-600/90"
          >
            <Link href={`/series/${seriesId}/seasons/${seasonId}/episodes/new`}>
              <Plus className="h-4 w-4" />
              Novo Episódio
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="episodes" className="flex items-center gap-2">
            <Tv className="h-4 w-4" />
            Episódios
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* Episodes Tab Content */}
        <TabsContent value="episodes" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-linear-to-br from-card to-card/80 border-border/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Tv className="h-5 w-5 text-blue-500" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-500/10">
                    Total
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Episódios</p>
                <p className="text-3xl font-bold">
                  {currentStats.watched_episodes}/{currentStats.total_episodes}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-card to-card/80 border-border/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Eye className="h-5 w-5 text-emerald-500" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-500/10"
                  >
                    Completos
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Progresso</p>
                <p className="text-3xl font-bold">
                  {currentStats.completion_percentage}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-card to-card/80 border-border/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-yellow-500/10">
                    Média
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Avaliação</p>
                <p className="text-3xl font-bold">
                  {currentStats.average_rating > 0
                    ? currentStats.average_rating.toFixed(1)
                    : "-"}
                  <span className="text-lg text-muted-foreground">/10</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-card to-card/80 border-border/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Clock className="h-5 w-5 text-purple-500" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-purple-500/10">
                    Duração
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tempo Total
                </p>
                <p className="text-3xl font-bold">
                  {formatDuration(currentStats.total_watch_time)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-card to-card/80 border-border/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-500/10">
                    Status
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Ano</p>
                <p className="text-3xl font-bold">
                  {season.release_year || "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Progresso da Temporada</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-semibold">
                      {currentStats.completion_percentage}%
                    </span>
                  </div>
                  <Progress
                    value={currentStats.completion_percentage}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {currentStats.watched_episodes} de{" "}
                      {currentStats.total_episodes} episódios assistidos
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => setMarkAllDialogOpen(true)}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Marcar Todos
                    </Button>
                  </div>
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
            Mostrando {filteredEpisodes.length} de {currentEpisodes.length}{" "}
            episódios
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
                  onToggleWatchStatus={(markAsWatched) =>
                    openWatchStatusDialog(episode, markAsWatched)
                  }
                  onDelete={() => handleDelete(episode.id)}
                  isDeleting={isDeleting === episode.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Statistics Tab Content */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Progresso</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {detailedStats.completionPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={detailedStats.completionPercentage}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {detailedStats.watchedEpisodes} de{" "}
                    {detailedStats.totalEpisodes} episódios
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span>Avaliação Média</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {detailedStats.averageRating > 0
                        ? detailedStats.averageRating.toFixed(1)
                        : "-"}
                    </span>
                    <span className="text-lg text-muted-foreground">/10</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Baseada em{" "}
                    {detailedStats.ratingDistribution.reduce(
                      (a, b) => a + b,
                      0,
                    )}{" "}
                    avaliações
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Tempo Total</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {formatDuration(detailedStats.totalDuration)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Média de {detailedStats.averageDuration} min/episódio
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Com Reviews</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {detailedStats.episodesWithReview}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      de {detailedStats.totalEpisodes}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {detailedStats.totalEpisodes > 0
                      ? Math.round(
                          (detailedStats.episodesWithReview /
                            detailedStats.totalEpisodes) *
                            100,
                        )
                      : 0}
                    % dos episódios
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Distribuição de Avaliações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {detailedStats.ratingDistribution.map((count, rating) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium">{rating}</span>
                      <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${detailedStats.totalEpisodes > 0 ? (count / detailedStats.totalEpisodes) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-sm text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Duration Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Distribuição por Duração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Episódios Curtos (&lt;30min)
                      </span>
                      <span className="font-semibold">
                        {detailedStats.shortEpisodes}
                      </span>
                    </div>
                    <Progress
                      value={
                        detailedStats.totalEpisodes > 0
                          ? (detailedStats.shortEpisodes /
                              detailedStats.totalEpisodes) *
                            100
                          : 0
                      }
                      className="h-2 bg-blue-100 dark:bg-blue-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Episódios Médios (30-45min)
                      </span>
                      <span className="font-semibold">
                        {detailedStats.mediumEpisodes}
                      </span>
                    </div>
                    <Progress
                      value={
                        detailedStats.totalEpisodes > 0
                          ? (detailedStats.mediumEpisodes /
                              detailedStats.totalEpisodes) *
                            100
                          : 0
                      }
                      className="h-2 bg-green-100 dark:bg-green-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Episódios Longos (&gt;45min)
                      </span>
                      <span className="font-semibold">
                        {detailedStats.longEpisodes}
                      </span>
                    </div>
                    <Progress
                      value={
                        detailedStats.totalEpisodes > 0
                          ? (detailedStats.longEpisodes /
                              detailedStats.totalEpisodes) *
                            100
                          : 0
                      }
                      className="h-2 bg-purple-100 dark:bg-purple-900/30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Episode Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Status dos Episódios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Assistidos</span>
                      <span className="font-semibold">
                        {detailedStats.watchedEpisodes}
                      </span>
                    </div>
                    <Progress
                      value={detailedStats.completionPercentage}
                      className="h-2 bg-emerald-100 dark:bg-emerald-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Não Assistidos</span>
                      <span className="font-semibold">
                        {detailedStats.unwatchedEpisodes}
                      </span>
                    </div>
                    <Progress
                      value={
                        detailedStats.totalEpisodes > 0
                          ? (detailedStats.unwatchedEpisodes /
                              detailedStats.totalEpisodes) *
                            100
                          : 0
                      }
                      className="h-2 bg-rose-100 dark:bg-rose-900/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Recomendados</span>
                      <span className="font-semibold">
                        {detailedStats.episodesWithRecommendation}
                      </span>
                    </div>
                    <Progress
                      value={
                        detailedStats.totalEpisodes > 0
                          ? (detailedStats.episodesWithRecommendation /
                              detailedStats.totalEpisodes) *
                            100
                          : 0
                      }
                      className="h-2 bg-blue-100 dark:bg-blue-900/30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Season Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5" />
                  Informações da Temporada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Número</p>
                      <p className="text-lg font-semibold">
                        {season.is_special
                          ? "Especial"
                          : `Temporada ${season.season_number}`}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ano</p>
                      <p className="text-lg font-semibold">
                        {season.release_year || "-"}
                      </p>
                    </div>
                  </div>

                  {season.name && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="text-lg font-semibold">{season.name}</p>
                    </div>
                  )}

                  {season.description && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="text-sm">{season.description}</p>
                    </div>
                  )}

                  {season.special_type && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Tipo de Especial
                      </p>
                      <Badge variant="outline">{season.special_type}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para marcar todos os episódios */}
      <Dialog open={markAllDialogOpen} onOpenChange={setMarkAllDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5" />
              Marcar Todos os Episódios
            </DialogTitle>
            <DialogDescription>
              Escolha como deseja marcar todos os episódios desta temporada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={handleMarkAllAsWatched}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Marcar Todos como Assistidos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentEpisodes.filter((ep) => !ep.is_watched).length}{" "}
                      episódios serão marcados
                    </p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={handleMarkAllAsUnwatched}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/30">
                    <EyeOff className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Marcar Todos como Não Assistidos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentEpisodes.filter((ep) => ep.is_watched).length}{" "}
                      episódios serão desmarcados
                    </p>
                  </div>
                </div>
                <X className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Esta ação afetará todos os episódios da temporada.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkAllDialogOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para alterar status de visualização de um episódio */}
      <Dialog
        open={watchStatusDialogOpen}
        onOpenChange={setWatchStatusDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isMarkingAsWatched ? (
                <>
                  <Eye className="h-5 w-5 text-emerald-500" />
                  Marcar como Assistido
                </>
              ) : (
                <>
                  <EyeOff className="h-5 w-5 text-rose-500" />
                  Marcar como Não Assistido
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isMarkingAsWatched
                ? `Configure os detalhes para o episódio ${selectedEpisode?.episode_number}`
                : `Tem certeza que deseja marcar o episódio ${selectedEpisode?.episode_number} como não assistido?`}
            </DialogDescription>
          </DialogHeader>

          {isMarkingAsWatched ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleWatchStatusUpdate();
              }}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="watchDate">
                    Data de Visualização (opcional)
                  </Label>
                  <Input
                    id="watchDate"
                    type="date"
                    value={watchDate}
                    onChange={(e) => setWatchDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta data será usada apenas se houver conteúdo vinculado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watchRating">Avaliação (opcional)</Label>
                  <Input
                    id="watchRating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="Ex: 8.5"
                    value={watchRating}
                    onChange={(e) => setWatchRating(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nota de 0 a 10 (apenas números)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watchReview">Crítica (opcional)</Label>
                  <Textarea
                    id="watchReview"
                    placeholder="O que achou deste episódio?"
                    value={watchReview}
                    onChange={(e) => setWatchReview(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWatchStatusDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Processando...
                    </>
                  ) : (
                    "Marcar como Assistido"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <div className="py-4">
                <p className="text-muted-foreground">
                  Esta ação removerá a avaliação e crítica do episódio.
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setWatchStatusDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleWatchStatusUpdate}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Processando...
                    </>
                  ) : (
                    "Marcar como Não Assistido"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  seriesId: string;
  seasonId: string;
  onToggleWatchStatus: (markAsWatched: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function EpisodeCard({
  episode,
  seriesId,
  seasonId,
  onToggleWatchStatus,
  onDelete,
  isDeleting,
}: EpisodeCardProps) {
  const router = useRouter();

  const getWatchedDate = () => {
    return episode.content?.watched_date;
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Episode Number */}
          <div className="shrink-0">
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-left hover:bg-transparent hover:underline"
                    onClick={() =>
                      router.push(
                        `/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}`,
                      )
                    }
                  >
                    <h3 className="font-semibold text-base">
                      {episode.name || `Episódio ${episode.episode_number}`}
                    </h3>
                  </Button>
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
                  {getWatchedDate() && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(getWatchedDate()!), "dd/MM/yyyy", {
                        locale: pt,
                      })}
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
                  <p className="text-sm text-muted-foreground line-clamp-2 flex items-start gap-1">
                    <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{episode.review}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons - VISÍVEIS FORA DO MENU */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant={episode.is_watched ? "outline" : "default"}
                  onClick={() => onToggleWatchStatus(!episode.is_watched)}
                  className="gap-2"
                >
                  {episode.is_watched ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Desmarcar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Marcar</span>
                    </>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}`,
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
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
                        {format(
                          new Date(episode.content.watched_date),
                          "dd/MM/yyyy",
                          { locale: pt },
                        )}
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
