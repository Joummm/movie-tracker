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
  CalendarDays,
  Filter,
  Grid3x3,
  List,
  Calendar as CalendarIcon,
  Hash,
  Percent,
  Timer,
  Heart,
  ThumbsUp,
  RefreshCw,
  Zap,
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
import { Separator } from "@/components/ui/separator";

interface Episode {
  id: string;
  episode_number: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  rating?: number;
  release_date?: string;
  review?: string;
  would_recommend?: boolean | null;
  would_rewatch?: boolean | null;
  last_rewatch_date?: string;
  rewatch_count?: number;
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
    review?: string;
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
  const [watchRecommend, setWatchRecommend] = useState<boolean | null>(null);
  const [watchRewatch, setWatchRewatch] = useState<boolean | null>(null);

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

  // Filtrar episódios
  const filteredEpisodes = currentEpisodes
    .filter((episode) => {
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
    })
    .sort((a, b) => a.episode_number - b.episode_number); // Sempre ordenar por número

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
    if (episode.last_rewatch_date) {
      return episode.last_rewatch_date;
    }
    if (episode.content?.watched_date) {
      return episode.content.watched_date;
    }
    return undefined;
  };

  // Marcar todos como assistidos com opções
  const handleMarkAllAsWatched = async (
    dateType: "today" | "unknown" = "today",
  ) => {
    setIsLoading(true);
    try {
      const unwatchedEpisodes = currentEpisodes.filter((ep) => !ep.is_watched);
      const episodeIds = unwatchedEpisodes.map((ep) => ep.id);

      if (episodeIds.length === 0) {
        toast.info("Todos os episódios já estão assistidos!");
        return;
      }

      // Preparar dados de atualização
      const updateData: any = {
        is_watched: true,
        updated_at: new Date().toISOString(),
      };

      // Definir data baseado no tipo selecionado
      if (dateType === "today") {
        const today = new Date().toISOString().split("T")[0];
        updateData.last_rewatch_date = today;
      } else if (dateType === "unknown") {
        updateData.last_rewatch_date = null;
      }

      // Atualizar episódios
      const { error } = await supabase
        .from("series_episodes")
        .update(updateData)
        .in("id", episodeIds);

      if (error) throw error;

      // Atualizar estado local
      const updatedEpisodes = currentEpisodes.map((ep) => {
        if (episodeIds.includes(ep.id)) {
          return {
            ...ep,
            is_watched: true,
            last_rewatch_date:
              dateType === "today" ? updateData.last_rewatch_date : undefined,
          };
        }
        return ep;
      });

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
        description: `${unwatchedEpisodes.length} episódios atualizados ${dateType === "today" ? "com data de hoje" : "com data desconhecida"}.`,
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

      // Atualizar todos os episódios
      const { error } = await supabase
        .from("series_episodes")
        .update({
          is_watched: false,
          last_rewatch_date: null,
          rating: null,
          review: null,
          would_recommend: null,
          would_rewatch: null,
          updated_at: new Date().toISOString(),
        })
        .in("id", episodeIds);

      if (error) throw error;

      // Atualizar estado local
      const updatedEpisodes = currentEpisodes.map((ep) => ({
        ...ep,
        is_watched: episodeIds.includes(ep.id) ? false : ep.is_watched,
        last_rewatch_date: episodeIds.includes(ep.id)
          ? undefined
          : ep.last_rewatch_date,
        rating: episodeIds.includes(ep.id) ? undefined : ep.rating,
        review: episodeIds.includes(ep.id) ? undefined : ep.review,
        would_recommend: episodeIds.includes(ep.id) ? null : ep.would_recommend,
        would_rewatch: episodeIds.includes(ep.id) ? null : ep.would_rewatch,
      }));

      setCurrentEpisodes(updatedEpisodes);

      // Atualizar temporada
      await supabase
        .from("series_seasons")
        .update({
          watched_episode_count: 0,
          average_rating: null,
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

    const existingDate = getEpisodeWatchedDate(episode);
    setWatchDate(existingDate || format(new Date(), "yyyy-MM-dd"));

    setWatchRating(episode.rating?.toString() || "");
    setWatchReview(episode.review || "");
    setWatchRecommend(episode.would_recommend ?? null);
    setWatchRewatch(episode.would_rewatch ?? null);
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
        updateData.last_rewatch_date =
          watchDate || new Date().toISOString().split("T")[0];

        if (watchRating && !isNaN(parseFloat(watchRating))) {
          updateData.rating = parseFloat(watchRating);
        } else {
          updateData.rating = null;
        }

        if (watchReview) {
          updateData.review = watchReview;
        } else {
          updateData.review = null;
        }

        updateData.would_recommend = watchRecommend;
        updateData.would_rewatch = watchRewatch;
      } else {
        updateData.last_rewatch_date = null;
        updateData.rating = null;
        updateData.review = null;
        updateData.would_recommend = null;
        updateData.would_rewatch = null;
      }

      const { error } = await supabase
        .from("series_episodes")
        .update(updateData)
        .eq("id", selectedEpisode.id);

      if (error) throw error;

      // Atualizar estado local
      const updatedEpisodes = currentEpisodes.map((ep) => {
        if (ep.id === selectedEpisode.id) {
          return {
            ...ep,
            is_watched: isMarkingAsWatched,
            last_rewatch_date: isMarkingAsWatched ? watchDate : undefined,
            rating:
              isMarkingAsWatched &&
              watchRating &&
              !isNaN(parseFloat(watchRating))
                ? parseFloat(watchRating)
                : undefined,
            review: isMarkingAsWatched ? watchReview || undefined : undefined,
            would_recommend: isMarkingAsWatched ? watchRecommend : null,
            would_rewatch: isMarkingAsWatched ? watchRewatch : null,
          };
        }
        return ep;
      });

      setCurrentEpisodes(updatedEpisodes);

      // Atualizar estatísticas da temporada
      const watchedCount = updatedEpisodes.filter((ep) => ep.is_watched).length;
      const totalWatchTime = updatedEpisodes.reduce(
        (sum, ep) => sum + (ep.duration || 0),
        0,
      );

      const ratedEpisodes = updatedEpisodes.filter(
        (ep) => ep.rating && ep.rating > 0,
      );
      const averageRating =
        ratedEpisodes.length > 0
          ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
            ratedEpisodes.length
          : null;

      await supabase
        .from("series_seasons")
        .update({
          watched_episode_count: watchedCount,
          average_rating: averageRating,
          total_watch_time: totalWatchTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seasonId)
        .eq("user_id", userId);

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
        .eq("id", episodeId);

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
    const episodesWithRewatch = currentEpisodes.filter(
      (ep) => ep.would_rewatch === true,
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

    // Episódios por ano de lançamento
    const episodesByYear: { [year: number]: number } = {};
    currentEpisodes.forEach((ep) => {
      if (ep.release_date) {
        const year = new Date(ep.release_date).getFullYear();
        episodesByYear[year] = (episodesByYear[year] || 0) + 1;
      }
    });

    // Status dos episódios
    const completedEpisodes = watchedEpisodes;
    const pendingEpisodes = unwatchedEpisodes;

    return {
      totalEpisodes,
      watchedEpisodes,
      unwatchedEpisodes,
      averageRating,
      totalDuration,
      averageDuration,
      episodesWithReview,
      episodesWithRecommendation,
      episodesWithRewatch,
      ratingDistribution,
      shortEpisodes,
      mediumEpisodes,
      longEpisodes,
      episodesByYear,
      completedEpisodes,
      pendingEpisodes,
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
            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-blue-600 bg-clip-text text-transparent">
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

        <div className="flex flex-wrap gap-3">
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
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-linear-to-br from-card to-card/80 border-border/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Hash className="h-5 w-5 text-blue-500" />
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
                    <Percent className="h-5 w-5 text-emerald-500" />
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
                    <Timer className="h-5 w-5 text-purple-500" />
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
                    <CalendarIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-500/10">
                    Ano
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Lançamento</p>
                <p className="text-3xl font-bold">
                  {season.release_year || "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
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
                    className="h-3 bg-linear-to-r from-emerald-500/20 to-emerald-500/40"
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
            <div className="flex rounded-lg border border-border/50">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="h-9 px-3 rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                Todos
              </Button>
              <Button
                variant={filter === "watched" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("watched")}
                className="h-9 px-3 rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Assistidos
              </Button>
              <Button
                variant={filter === "unwatched" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("unwatched")}
                className="h-9 px-3 rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Não Assistidos
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border/50">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-9 px-3 rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 px-3 rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredEpisodes.length} de {currentEpisodes.length}{" "}
            episódios
          </div>

          {/* Episodes List/Grid */}
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
          ) : viewMode === "list" ? (
            <div className="space-y-3">
              {filteredEpisodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  seriesId={seriesId}
                  seasonId={seasonId}
                  seasonReleaseYear={season.release_year}
                  onToggleWatchStatus={(markAsWatched) =>
                    openWatchStatusDialog(episode, markAsWatched)
                  }
                  onDelete={() => handleDelete(episode.id)}
                  isDeleting={isDeleting === episode.id}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEpisodes.map((episode) => (
                <EpisodeGridCard
                  key={episode.id}
                  episode={episode}
                  seriesId={seriesId}
                  seasonId={seasonId}
                  seasonReleaseYear={season.release_year}
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
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <Timer className="h-5 w-5" />
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

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Para Reassistir</span>
                      <span className="font-semibold">
                        {detailedStats.episodesWithRewatch}
                      </span>
                    </div>
                    <Progress
                      value={
                        detailedStats.totalEpisodes > 0
                          ? (detailedStats.episodesWithRewatch /
                              detailedStats.totalEpisodes) *
                            100
                          : 0
                      }
                      className="h-2 bg-indigo-100 dark:bg-indigo-900/30"
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

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Episódios</p>
                      <p className="text-xl font-bold">
                        {detailedStats.totalEpisodes}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Tempo Total
                      </p>
                      <p className="text-xl font-bold">
                        {formatDuration(detailedStats.totalDuration)}
                      </p>
                    </div>
                  </div>
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
              {/* Opção 1: Marcar com data de hoje */}
              <div
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => handleMarkAllAsWatched("today")}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Marcar Todos como Assistidos (Hoje)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentEpisodes.filter((ep) => !ep.is_watched).length}{" "}
                      episódios serão marcados com data atual
                    </p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Opção 2: Marcar com data desconhecida */}
              <div
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => handleMarkAllAsWatched("unknown")}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Marcar Todos como Assistidos (Data Desconhecida)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentEpisodes.filter((ep) => !ep.is_watched).length}{" "}
                      episódios serão marcados sem data específica
                    </p>
                  </div>
                </div>
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>

              {/* Opção 3: Marcar como não assistidos */}
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
                  <div className="flex gap-2">
                    <Input
                      id="watchDate"
                      type="date"
                      value={watchDate}
                      onChange={(e) => setWatchDate(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setWatchDate(format(new Date(), "yyyy-MM-dd"))
                      }
                    >
                      Hoje
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watchRating">Avaliação (0-10)</Label>
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
                    Deixe vazio para não avaliar
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Recomendaria este episódio?
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          watchRecommend === null ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setWatchRecommend(null)}
                        className={
                          watchRecommend === null
                            ? "bg-gray-500 hover:bg-gray-600"
                            : ""
                        }
                      >
                        Não Definido
                      </Button>
                      <Button
                        type="button"
                        variant={
                          watchRecommend === true ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setWatchRecommend(true)}
                        className={
                          watchRecommend === true
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : ""
                        }
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Sim
                      </Button>
                      <Button
                        type="button"
                        variant={
                          watchRecommend === false ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setWatchRecommend(false)}
                        className={
                          watchRecommend === false
                            ? "bg-rose-500 hover:bg-rose-600"
                            : ""
                        }
                      >
                        <X className="h-3 w-3 mr-1" />
                        Não
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Assistiria novamente?
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={watchRewatch === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setWatchRewatch(null)}
                        className={
                          watchRewatch === null
                            ? "bg-gray-500 hover:bg-gray-600"
                            : ""
                        }
                      >
                        Não Definido
                      </Button>
                      <Button
                        type="button"
                        variant={watchRewatch === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => setWatchRewatch(true)}
                        className={
                          watchRewatch === true
                            ? "bg-blue-500 hover:bg-blue-600"
                            : ""
                        }
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sim
                      </Button>
                      <Button
                        type="button"
                        variant={watchRewatch === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => setWatchRewatch(false)}
                        className={
                          watchRewatch === false
                            ? "bg-rose-500 hover:bg-rose-600"
                            : ""
                        }
                      >
                        <X className="h-3 w-3 mr-1" />
                        Não
                      </Button>
                    </div>
                  </div>
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
                  Esta ação removerá a avaliação, crítica, data de visualização
                  e preferências do episódio.
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
  seasonReleaseYear?: number;
  onToggleWatchStatus: (markAsWatched: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function EpisodeCard({
  episode,
  seriesId,
  seasonId,
  seasonReleaseYear,
  onToggleWatchStatus,
  onDelete,
  isDeleting,
}: EpisodeCardProps) {
  const router = useRouter();

  const getWatchedDate = () => {
    if (episode.last_rewatch_date) {
      return episode.last_rewatch_date;
    }
    if (episode.content?.watched_date) {
      return episode.content.watched_date;
    }
    return undefined;
  };

  const getReleaseYear = () => {
    if (episode.release_date) {
      return new Date(episode.release_date).getFullYear();
    }
    return seasonReleaseYear;
  };

  return (
    <Card className="hover:shadow-md transition-shadow group border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Episode Number */}
          <div className="shrink-0">
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                episode.is_watched
                  ? "bg-linear-to-br from-emerald-500 to-green-600 text-white"
                  : "bg-linear-to-br from-muted to-muted/80 text-muted-foreground"
              }`}
            >
              <span className="font-bold text-lg">
                #{episode.episode_number}
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
                    <Badge className="bg-emerald-500 text-white border-none">
                      <Eye className="h-3 w-3 mr-1" />
                      Assistido
                    </Badge>
                  )}
                  {getReleaseYear() && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {getReleaseYear()}
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
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(getWatchedDate()!), "dd/MM/yyyy", {
                        locale: pt,
                      })}
                    </span>
                  )}
                  {episode.rating && episode.rating > 0 && (
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant={episode.is_watched ? "outline" : "default"}
                  onClick={() => onToggleWatchStatus(!episode.is_watched)}
                  className={`gap-2 ${episode.is_watched ? "hover:bg-emerald-500 hover:text-emerald-50" : "bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"}`}
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
                      className="text-rose-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent mr-2" />
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

            {/* Preferences */}
            {(episode.would_recommend !== null ||
              episode.would_rewatch !== null) && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                {episode.would_recommend !== null && (
                  <Badge
                    variant={episode.would_recommend ? "default" : "secondary"}
                    className={
                      episode.would_recommend
                        ? "bg-linear-to-r from-emerald-500 to-green-600"
                        : "bg-rose-500"
                    }
                  >
                    {episode.would_recommend
                      ? "✓ Recomendaria"
                      : "✗ Não Recomendaria"}
                  </Badge>
                )}
                {episode.would_rewatch !== null && (
                  <Badge
                    variant={episode.would_rewatch ? "default" : "secondary"}
                    className={
                      episode.would_rewatch
                        ? "bg-linear-to-r from-blue-500 to-indigo-600"
                        : "bg-rose-500"
                    }
                  >
                    {episode.would_rewatch
                      ? "✓ Assistiria Novamente"
                      : "✗ Não Assistiria Novamente"}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid Card Component
function EpisodeGridCard({
  episode,
  seriesId,
  seasonId,
  seasonReleaseYear,
  onToggleWatchStatus,
  onDelete,
  isDeleting,
}: EpisodeCardProps) {
  const router = useRouter();

  const getWatchedDate = () => {
    if (episode.last_rewatch_date) {
      return episode.last_rewatch_date;
    }
    if (episode.content?.watched_date) {
      return episode.content.watched_date;
    }
    return undefined;
  };

  const getReleaseYear = () => {
    if (episode.release_date) {
      return new Date(episode.release_date).getFullYear();
    }
    return seasonReleaseYear;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 group">
      <CardContent className="p-4">
        {/* Episode Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                episode.is_watched
                  ? "bg-linear-to-br from-emerald-500 to-green-600 text-white"
                  : "bg-linear-to-br from-muted to-muted/80 text-muted-foreground"
              }`}
            >
              <span className="font-bold">{episode.episode_number}</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">
                {episode.name || `Episódio ${episode.episode_number}`}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {episode.is_watched && (
                  <Badge className="bg-emerald-500 text-white border-none text-xs">
                    <Eye className="h-2.5 w-2.5 mr-1" />
                  </Badge>
                )}
                {getReleaseYear() && (
                  <Badge variant="outline" className="text-xs">
                    {getReleaseYear()}
                  </Badge>
                )}
                {episode.rating && episode.rating > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 mr-1" />
                    {episode.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

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
                onClick={() => onToggleWatchStatus(!episode.is_watched)}
              >
                {episode.is_watched ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Desmarcar
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-rose-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent mr-2" />
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

        {/* Episode Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{episode.duration ? `${episode.duration} min` : "-"}</span>
            </div>
            {getWatchedDate() && (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span>
                  {format(new Date(getWatchedDate()!), "dd/MM", { locale: pt })}
                </span>
              </div>
            )}
          </div>

          {episode.review && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {episode.review}
            </p>
          )}

          {/* Preferences */}
          {(episode.would_recommend !== null ||
            episode.would_rewatch !== null) && (
            <div className="flex flex-wrap gap-1 pt-2">
              {episode.would_recommend !== null && (
                <Badge
                  variant="outline"
                  className={`text-xs ${episode.would_recommend ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-rose-500/10 text-rose-700 border-rose-500/30"}`}
                >
                  {episode.would_recommend ? "✓ Recomendo" : "✗ Não Recomendo"}
                </Badge>
              )}
              {episode.would_rewatch !== null && (
                <Badge
                  variant="outline"
                  className={`text-xs ${episode.would_rewatch ? "bg-blue-500/10 text-blue-700 border-blue-500/30" : "bg-rose-500/10 text-rose-700 border-rose-500/30"}`}
                >
                  {episode.would_rewatch
                    ? "✓ Reassistiria"
                    : "✗ Não Reassistiria"}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Quick Action */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant={episode.is_watched ? "outline" : "default"}
            size="sm"
            className="w-full"
            onClick={() => onToggleWatchStatus(!episode.is_watched)}
          >
            {episode.is_watched
              ? "Desmarcar como Assistido"
              : "Marcar como Assistido"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
