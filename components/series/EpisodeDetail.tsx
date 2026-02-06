// components/series/EpisodeDetail.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Edit,
  ArrowLeft,
  CheckCircle,
  EyeOff,
  ThumbsUp,
  RefreshCw,
  Tv,
  Hash,
  AlertCircle,
  Info,
  Play,
  X,
  Check,
  Minus,
  TrendingUp,
  BarChart3,
  Heart,
  CalendarDays,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EpisodeDetailProps {
  episode: any;
  series: any;
  season: any;
  userId: string;
}

export function EpisodeDetail({
  episode,
  series,
  season,
  userId,
}: EpisodeDetailProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: episode.name || "",
    rating: episode.rating || 0,
    review: episode.review || "",
    would_recommend: episode.would_recommend,
    would_rewatch: episode.would_rewatch,
    is_watched: episode.is_watched,
    watched_date: episode.last_rewatch_date || "",
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  const getDurationText = (minutes?: number) => {
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

  const handleThreeWayToggle = (
    field: "would_recommend" | "would_rewatch",
    value: boolean | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const openMarkDialog = () => {
    setFormData((prev) => ({
      ...prev,
      watched_date:
        episode.last_rewatch_date || new Date().toISOString().split("T")[0],
      rating: episode.rating || 0,
      review: episode.review || "",
      would_recommend: episode.would_recommend,
      would_rewatch: episode.would_rewatch,
      is_watched: !episode.is_watched,
    }));
    setMarkDialogOpen(true);
  };

  const handleMarkEpisode = async () => {
    setIsLoading(true);
    try {
      const updateData: any = {
        is_watched: formData.is_watched,
        updated_at: new Date().toISOString(),
      };

      if (formData.is_watched) {
        // Se está marcando como assistido
        updateData.last_rewatch_date =
          formData.watched_date || new Date().toISOString().split("T")[0];

        if (formData.rating && !isNaN(parseFloat(formData.rating.toString()))) {
          updateData.rating = parseFloat(formData.rating.toString());
        } else {
          updateData.rating = null;
        }

        if (formData.review) {
          updateData.review = formData.review;
        } else {
          updateData.review = null;
        }

        updateData.would_recommend = formData.would_recommend;
        updateData.would_rewatch = formData.would_rewatch;
      } else {
        // Se está marcando como não assistido
        updateData.last_rewatch_date = null;
        updateData.rating = null;
        updateData.review = null;
        updateData.would_recommend = null;
        updateData.would_rewatch = null;
      }

      const { error } = await supabase
        .from("series_episodes")
        .update(updateData)
        .eq("id", episode.id);

      if (error) throw error;

      // Atualizar estatísticas da temporada
      const { data: episodes } = await supabase
        .from("series_episodes")
        .select("id, is_watched, rating, duration")
        .eq("season_id", season.id);

      if (episodes) {
        const totalEpisodes = episodes.length;
        const watchedEpisodes = episodes.filter((ep) => ep.is_watched).length;
        const totalWatchTime = episodes.reduce(
          (sum, ep) => sum + (ep.duration || 0),
          0,
        );
        const ratedEpisodes = episodes.filter(
          (ep) => ep.rating && ep.rating > 0,
        );
        const averageRating =
          ratedEpisodes.length > 0
            ? ratedEpisodes.reduce((sum, ep) => sum + ep.rating!, 0) /
              ratedEpisodes.length
            : 0;

        await supabase
          .from("series_seasons")
          .update({
            watched_episode_count: watchedEpisodes,
            average_rating: averageRating > 0 ? averageRating : null,
            total_watch_time: totalWatchTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", season.id)
          .eq("user_id", userId);
      }

      toast.success(
        formData.is_watched
          ? "Episódio marcado como assistido!"
          : "Episódio marcado como não assistido!",
        {
          description: `Episódio ${episode.episode_number} atualizado.`,
          duration: 3000,
        },
      );

      setMarkDialogOpen(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Erro ao atualizar episódio:", error);
      toast.error("Erro ao atualizar", {
        description: "Não foi possível atualizar o episódio.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        name: formData.name || null,
        rating: formData.rating > 0 ? formData.rating : null,
        review: formData.review || null,
        would_recommend: formData.would_recommend,
        would_rewatch: formData.would_rewatch,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("series_episodes")
        .update(updateData)
        .eq("id", episode.id);

      if (error) throw error;

      toast.success("Alterações guardadas com sucesso!", {
        duration: 3000,
      });

      setIsEditing(false);
      setEditDialogOpen(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Erro ao guardar alterações:", error);
      toast.error("Erro ao guardar", {
        description: "Não foi possível guardar as alterações.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render three-way toggle component
  const renderThreeWayToggle = (
    label: string,
    description: string,
    field: "would_recommend" | "would_rewatch",
    value: boolean | null,
    icon: React.ReactNode,
    colorClass: string,
  ) => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-base font-semibold flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-1 p-1 bg-muted/20 rounded-lg">
        <button
          type="button"
          onClick={() => handleThreeWayToggle(field, null)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${value === null ? `${colorClass} text-white` : "bg-background hover:bg-muted"}`}
          disabled={isLoading}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleThreeWayToggle(field, false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${value === false ? "bg-destructive text-destructive-foreground" : "bg-background hover:bg-muted"}`}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
          Não
        </button>
        <button
          type="button"
          onClick={() => handleThreeWayToggle(field, true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${value === true ? `${colorClass} text-white` : "bg-background hover:bg-muted"}`}
          disabled={isLoading}
        >
          <Check className="h-4 w-4" />
          Sim
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              router.push(`/series/${series.id}/seasons/${season.id}/episodes`)
            }
            className="h-10 w-10 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Button
                variant="link"
                onClick={() => router.push(`/series/${series.id}`)}
                className="p-0 h-auto text-muted-foreground hover:text-primary"
              >
                {series.name}
              </Button>
              <span>/</span>
              <Button
                variant="link"
                onClick={() =>
                  router.push(
                    `/series/${series.id}/seasons/${season.id}/episodes`,
                  )
                }
                className="p-0 h-auto text-muted-foreground hover:text-primary"
              >
                {season.is_special
                  ? "Especial"
                  : `Temporada ${season.season_number}`}
              </Button>
              <span>/</span>
              <span className="font-semibold text-foreground">
                Episódio {episode.episode_number}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {episode.name || `Episódio ${episode.episode_number}`}
            </h1>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={openMarkDialog}
            disabled={isLoading}
            variant={episode.is_watched ? "outline" : "default"}
            className="gap-2"
          >
            {episode.is_watched ? (
              <>
                <EyeOff className="h-4 w-4" />
                Marcar como Não Assistido
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Marcar como Assistido
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Editar Detalhes
          </Button>

          <div className="ml-auto flex items-center gap-4">
            {episode.rating && episode.rating > 0 && (
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 px-3 py-1.5">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-2" />
                <span className="font-bold text-base">
                  {episode.rating.toFixed(1)}/10
                </span>
              </Badge>
            )}
            {episode.would_recommend && (
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                Recomendaria
              </Badge>
            )}
            {episode.would_rewatch && (
              <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Assistiria novamente
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Episode Details - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Card */}
          {episode.review && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Minha Crítica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {episode.review}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Estatísticas do Episódio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Duração</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {getDurationText(episode.duration)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div
                      className={`h-2 w-2 rounded-full ${episode.is_watched ? "bg-emerald-500" : "bg-yellow-500"}`}
                    />
                    <span>Status</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {episode.is_watched ? "Assistido" : "Não Assistido"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4" />
                    <span>Vezes Reassistido</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {episode.rewatch_count || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Última Revisão</span>
                  </div>
                  <p className="text-xl font-bold">
                    {episode.last_rewatch_date
                      ? formatDateShort(episode.last_rewatch_date)
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          {(episode.would_recommend !== null ||
            episode.would_rewatch !== null) && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Minhas Preferências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {episode.would_recommend !== null && (
                    <div
                      className={`px-4 py-3 rounded-lg ${episode.would_recommend ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-destructive/10 border border-destructive/30"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsUp
                          className={`h-4 w-4 ${episode.would_recommend ? "text-emerald-500" : "text-destructive"}`}
                        />
                        <span className="font-semibold">Recomendaria</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {episode.would_recommend
                          ? "Sim, recomendaria"
                          : "Não recomendaria"}
                      </p>
                    </div>
                  )}

                  {episode.would_rewatch !== null && (
                    <div
                      className={`px-4 py-3 rounded-lg ${episode.would_rewatch ? "bg-blue-500/10 border border-blue-500/30" : "bg-destructive/10 border border-destructive/30"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw
                          className={`h-4 w-4 ${episode.would_rewatch ? "text-blue-500" : "text-destructive"}`}
                        />
                        <span className="font-semibold">
                          Assistiria Novamente
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {episode.would_rewatch
                          ? "Sim, assistiria novamente"
                          : "Não assistiria novamente"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Episode Info Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Informações do Episódio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium flex items-center gap-2 text-lg">
                    <Hash className="h-5 w-5 text-primary" />
                    {episode.episode_number}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {getDurationText(episode.duration)}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Data de Lançamento
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(episode.release_date)}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Série</p>
                  <p className="font-medium flex items-center gap-2">
                    <Tv className="h-4 w-4" />
                    {series.name}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Temporada</p>
                  <p className="font-medium">
                    {season.is_special
                      ? "Especial"
                      : `Temporada ${season.season_number}`}
                    {season.name && `: ${season.name}`}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Data de Visualização
                  </p>
                  <p className="font-medium">
                    {episode.last_rewatch_date
                      ? formatDate(episode.last_rewatch_date)
                      : "Não visualizado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="border-border/50 bg-linear-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Metadados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1 text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Criado em</span>
                  <span className="font-medium">
                    {new Date(episode.created_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Atualizado em</span>
                  <span className="font-medium">
                    {new Date(episode.updated_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="pt-2">
                <p className="font-medium text-foreground mb-1">
                  ID do Episódio
                </p>
                <p className="text-xs text-muted-foreground font-mono break-all bg-muted/50 p-2 rounded">
                  {episode.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para marcar como assistido/não assistido */}
      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formData.is_watched ? (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Marcar como Assistido
                </>
              ) : (
                <>
                  <EyeOff className="h-5 w-5 text-yellow-500" />
                  Marcar como Não Assistido
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {formData.is_watched
                ? `Configurar detalhes do episódio ${episode.episode_number}`
                : `Tem certeza que deseja marcar o episódio ${episode.episode_number} como não assistido?`}
            </DialogDescription>
          </DialogHeader>

          {formData.is_watched ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleMarkEpisode();
              }}
            >
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="watched_date">Data de Visualização</Label>
                    <div className="flex gap-2">
                      <Input
                        id="watched_date"
                        type="date"
                        value={formData.watched_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            watched_date: e.target.value,
                          }))
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            watched_date: new Date()
                              .toISOString()
                              .split("T")[0],
                          }))
                        }
                      >
                        Hoje
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Avaliação (0-10)</Label>
                    <Input
                      id="rating"
                      name="rating"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="8.5"
                      value={formData.rating}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe 0 para não avaliar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Crítica (opcional)</Label>
                    <Textarea
                      id="review"
                      name="review"
                      placeholder="O que achou deste episódio?"
                      value={formData.review}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-6">
                    {renderThreeWayToggle(
                      "Recomendaria este episódio?",
                      "Recomendaria a outros utilizadores?",
                      "would_recommend",
                      formData.would_recommend,
                      <ThumbsUp className="h-4 w-4 text-emerald-500" />,
                      "bg-emerald-500",
                    )}

                    {renderThreeWayToggle(
                      "Assistiria novamente?",
                      "Veria este episódio novamente no futuro?",
                      "would_rewatch",
                      formData.would_rewatch,
                      <RefreshCw className="h-4 w-4 text-blue-500" />,
                      "bg-blue-500",
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMarkDialogOpen(false)}
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
                  onClick={() => setMarkDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleMarkEpisode}
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

      {/* Dialog para editar detalhes */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Detalhes do Episódio
            </DialogTitle>
            <DialogDescription>
              Edite as informações do episódio {episode.episode_number}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveChanges();
            }}
          >
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name">Nome do Episódio (opcional)</Label>
                  <Input
                    id="edit_name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={`Episódio ${episode.episode_number}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_rating">Avaliação (0-10)</Label>
                  <Input
                    id="edit_rating"
                    name="rating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="8.5"
                    value={formData.rating}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe 0 para não avaliar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_review">Crítica (opcional)</Label>
                  <Textarea
                    id="edit_review"
                    name="review"
                    placeholder="O que achou deste episódio?"
                    value={formData.review}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-6">
                  {renderThreeWayToggle(
                    "Recomendaria este episódio?",
                    "Recomendaria a outros utilizadores?",
                    "would_recommend",
                    formData.would_recommend,
                    <ThumbsUp className="h-4 w-4 text-emerald-500" />,
                    "bg-emerald-500",
                  )}

                  {renderThreeWayToggle(
                    "Assistiria novamente?",
                    "Veria este episódio novamente no futuro?",
                    "would_rewatch",
                    formData.would_rewatch,
                    <RefreshCw className="h-4 w-4 text-blue-500" />,
                    "bg-blue-500",
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
