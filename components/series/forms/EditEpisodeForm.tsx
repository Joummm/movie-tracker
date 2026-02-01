// components/series/forms/EditEpisodeForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  Star,
  Eye,
  FileText,
  Save,
  X,
  AlertTriangle,
  ThumbsUp,
  RefreshCw,
  Tv,
  Hash,
  Info,
  Trash2,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EditEpisodeFormProps {
  episode: any;
  seriesId: string;
  seasonId: string;
  userId: string;
  seriesName: string;
  seasonNumber: number;
  isSpecialSeason: boolean;
}

export function EditEpisodeForm({
  episode,
  seriesId,
  seasonId,
  userId,
  seriesName,
  seasonNumber,
  isSpecialSeason,
}: EditEpisodeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: episode.name || "",
    episode_number: episode.episode_number || 1,
    duration: episode.duration || 45,
    release_date: episode.release_date || "",
    is_watched: episode.is_watched || false,
    rating: episode.rating || 0,
    review: episode.review || "",
    would_recommend: episode.would_recommend || false,
    would_rewatch: episode.would_rewatch || false,
    rewatch_count: episode.rewatch_count || 0,
    last_rewatch_date: episode.last_rewatch_date || "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verificar se o número do episódio mudou
      const episodeNumber = formData.episode_number;
      if (episodeNumber !== episode.episode_number) {
        // Verificar se já existe outro episódio com este número
        const { data: existingEpisode, error: checkError } = await supabase
          .from("series_episodes")
          .select("id, episode_number, name")
          .eq("season_id", seasonId)
          .eq("episode_number", episodeNumber)
          .neq("id", episode.id) // Excluir o próprio episódio
          .maybeSingle();

        if (checkError) {
          console.error(
            "Erro ao verificar episódio existente:",
            checkError.message || checkError,
          );
        }

        if (existingEpisode) {
          throw new Error(
            `Já existe um episódio com o número ${episodeNumber} nesta temporada. Por favor, use um número diferente.`,
          );
        }
      }

      const episodeData = {
        name: formData.name || null,
        episode_number: formData.episode_number,
        duration: formData.duration || null,
        release_date: formData.release_date || null,
        is_watched: formData.is_watched,
        rating: formData.rating > 0 ? formData.rating : null,
        review: formData.review || null,
        would_recommend: formData.would_recommend || null,
        would_rewatch: formData.would_rewatch || null,
        rewatch_count: formData.rewatch_count || 0,
        last_rewatch_date: formData.last_rewatch_date || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("series_episodes")
        .update(episodeData)
        .eq("id", episode.id);

      if (error) {
        console.error("Erro ao atualizar episódio:", error.message || error);

        // Verificar se é erro de constraint de unicidade
        if (
          error.message?.includes("duplicate key") ||
          error.message?.includes("unique constraint")
        ) {
          throw new Error(
            `Já existe um episódio com o número ${formData.episode_number} nesta temporada. Por favor, use um número diferente.`,
          );
        }

        throw error;
      }

      try {
        const { data: episodes } = await supabase
          .from("series_episodes")
          .select("id, is_watched, rating, duration")
          .eq("season_id", seasonId);

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
              episode_count: totalEpisodes,
              watched_episode_count: watchedEpisodes,
              average_rating: averageRating > 0 ? averageRating : null,
              total_watch_time: totalWatchTime,
              updated_at: new Date().toISOString(),
            })
            .eq("id", seasonId)
            .eq("user_id", userId);
        }
      } catch (updateError: any) {
        console.warn(
          "Não foi possível atualizar estatísticas:",
          updateError.message || updateError,
        );
      }

      toast.success("Episódio atualizado com sucesso!", {
        description: "As alterações foram guardadas.",
        duration: 4000,
      });

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/series/${seriesId}/seasons/${seasonId}`);
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao atualizar episódio:", error.message || error);
      toast.error("Erro ao atualizar episódio", {
        description: error.message || "Ocorreu um erro inesperado.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("series_episodes")
        .delete()
        .eq("id", episode.id);

      if (error) throw error;

      try {
        const { data: episodes } = await supabase
          .from("series_episodes")
          .select("id, is_watched, rating, duration")
          .eq("season_id", seasonId);

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
              episode_count: totalEpisodes,
              watched_episode_count: watchedEpisodes,
              average_rating: averageRating > 0 ? averageRating : null,
              total_watch_time: totalWatchTime,
              updated_at: new Date().toISOString(),
            })
            .eq("id", seasonId)
            .eq("user_id", userId);
        }
      } catch (updateError: any) {
        console.warn(
          "Não foi possível atualizar estatísticas:",
          updateError.message || updateError,
        );
      }

      toast.success("Episódio excluído com sucesso!", {
        description: "O episódio foi removido permanentemente.",
        duration: 4000,
      });

      // Redirect after 1 second
      setTimeout(() => {
        router.push(`/series/${seriesId}/seasons/${seasonId}`);
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao excluir episódio:", error.message || error);
      toast.error("Erro ao excluir episódio", {
        description: error.message || "Ocorreu um erro inesperado.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/series/${seriesId}/seasons/${seasonId}`)
            }
            className="mb-6 gap-2 hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
            Voltar para temporada
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-linear-to-br from-primary/10 to-primary/5">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-blue-600 bg-clip-text text-transparent">
                  Editar Episódio
                </h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Editando: Episódio {episode.episode_number} de "
                <span className="font-semibold text-primary">{seriesName}</span>
                " - {isSpecialSeason ? "Especial" : `Temporada ${seasonNumber}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/series/${seriesId}/seasons/${seasonId}`)
                }
                disabled={isLoading}
                className="gap-2 border-border/50 hover:border-primary/30"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                form="edit-episode-form"
                disabled={isLoading}
                className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="bg-linear-to-r from-primary/5 via-primary/5 to-transparent p-1">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="px-4 md:px-6 pt-4">
                    <TabsList className="grid grid-cols-3 w-full bg-background/50 border border-border/30">
                      <TabsTrigger
                        value="basic"
                        className="flex items-center gap-2 py-2.5 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <Info className="h-4 w-4" />
                        <span className="hidden sm:inline">Básico</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="rating"
                        className="flex items-center gap-2 py-2.5 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <Star className="h-4 w-4" />
                        <span className="hidden sm:inline">Avaliação</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="advanced"
                        className="flex items-center gap-2 py-2.5 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Avançado</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Basic Tab */}
                  <TabsContent value="basic" className="m-0 p-4 md:p-6">
                    <form id="edit-episode-form" onSubmit={handleSubmit}>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label
                              htmlFor="episode_number"
                              className="text-base font-semibold mb-2 flex items-center gap-2"
                            >
                              <Hash className="h-4 w-4 text-primary" />
                              Número do Episódio
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              id="episode_number"
                              name="episode_number"
                              type="number"
                              min="0"
                              value={formData.episode_number}
                              onChange={handleInputChange}
                              placeholder="1"
                              className="h-12 text-lg border-border/50 focus:border-primary focus:ring-primary/20"
                              required
                              disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              Cada número deve ser único por temporada.
                            </p>
                          </div>

                          <div>
                            <Label
                              htmlFor="duration"
                              className="text-base font-semibold mb-2 flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4 text-blue-500" />
                              Duração (minutos)
                            </Label>
                            <Input
                              id="duration"
                              name="duration"
                              type="number"
                              min="0"
                              value={formData.duration}
                              onChange={handleInputChange}
                              placeholder="45"
                              className="h-12 border-border/50"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="name"
                            className="text-base font-semibold mb-2 flex items-center gap-2"
                          >
                            <Tv className="h-4 w-4 text-primary" />
                            Nome do Episódio (opcional)
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Ex: O Início, A Grande Virada, etc."
                            className="border-border/50"
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="release_date"
                            className="text-base font-semibold mb-2 flex items-center gap-2"
                          >
                            <Calendar className="h-4 w-4 text-primary" />
                            Data de Lançamento (opcional)
                          </Label>
                          <Input
                            id="release_date"
                            name="release_date"
                            type="date"
                            value={formData.release_date}
                            onChange={handleInputChange}
                            className="border-border/50"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="bg-linear-to-br from-card to-card/80 rounded-lg border border-border/30 p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                {formData.is_watched ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-yellow-500" />
                                )}
                                Status de Visualização
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {formData.is_watched
                                  ? "Este episódio já foi assistido"
                                  : "Este episódio ainda não foi assistido"}
                              </p>
                            </div>
                            <Switch
                              id="is_watched"
                              checked={formData.is_watched}
                              onCheckedChange={(checked) =>
                                handleSwitchChange("is_watched", checked)
                              }
                              disabled={isLoading}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </div>

                          {formData.is_watched && (
                            <div className="mt-4 space-y-2">
                              <Label
                                htmlFor="last_rewatch_date"
                                className="text-sm"
                              >
                                Data de Visualização (opcional)
                              </Label>
                              <Input
                                id="last_rewatch_date"
                                name="last_rewatch_date"
                                type="date"
                                value={formData.last_rewatch_date}
                                onChange={handleInputChange}
                                className="border-border/50"
                                disabled={isLoading}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Rating Tab */}
                  <TabsContent value="rating" className="m-0 p-4 md:p-6">
                    <form id="edit-episode-form" onSubmit={handleSubmit}>
                      <div className="space-y-6">
                        <div>
                          <Label
                            htmlFor="rating"
                            className="text-base font-semibold mb-2 flex items-center gap-2"
                          >
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            Avaliação (0-10)
                          </Label>
                          <div className="relative">
                            <Input
                              id="rating"
                              name="rating"
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={formData.rating}
                              onChange={handleInputChange}
                              placeholder="8.5"
                              className="h-12 pl-10 border-border/50"
                              disabled={isLoading}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Star className="h-4 w-4 text-yellow-500" />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Deixe 0 para não avaliar
                          </p>
                        </div>

                        <div>
                          <Label
                            htmlFor="review"
                            className="text-base font-semibold mb-2"
                          >
                            Crítica / Comentários (opcional)
                          </Label>
                          <Textarea
                            id="review"
                            name="review"
                            value={formData.review}
                            onChange={handleInputChange}
                            placeholder="Escreva sua crítica ou comentários sobre este episódio..."
                            rows={6}
                            className="border-border/50 resize-none"
                            disabled={isLoading}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                                Recomendaria este episódio?
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Recomendaria a outros utilizadores?
                              </p>
                            </div>
                            <Switch
                              id="would_recommend"
                              checked={formData.would_recommend}
                              onCheckedChange={(checked) =>
                                handleSwitchChange("would_recommend", checked)
                              }
                              disabled={isLoading}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-blue-500" />
                                Assistiria novamente?
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Veria este episódio novamente no futuro?
                              </p>
                            </div>
                            <Switch
                              id="would_rewatch"
                              checked={formData.would_rewatch}
                              onCheckedChange={(checked) =>
                                handleSwitchChange("would_rewatch", checked)
                              }
                              disabled={isLoading}
                              className="data-[state=checked]:bg-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="m-0 p-4 md:p-6">
                    <form id="edit-episode-form" onSubmit={handleSubmit}>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label
                              htmlFor="rewatch_count"
                              className="text-base font-semibold mb-2"
                            >
                              Vezes Reassistido
                            </Label>
                            <Input
                              id="rewatch_count"
                              name="rewatch_count"
                              type="number"
                              min="0"
                              value={formData.rewatch_count}
                              onChange={handleInputChange}
                              placeholder="0"
                              className="border-border/50"
                              disabled={isLoading}
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="last_rewatch_date"
                              className="text-base font-semibold mb-2"
                            >
                              Última Revisão (opcional)
                            </Label>
                            <Input
                              id="last_rewatch_date"
                              name="last_rewatch_date"
                              type="date"
                              value={formData.last_rewatch_date}
                              onChange={handleInputChange}
                              className="border-border/50"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </div>

          {/* Preview & Info Section - 1/3 width */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  Como o episódio aparecerá após guardar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-lg p-4 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                        >
                          {isSpecialSeason
                            ? "Especial"
                            : `Temporada ${seasonNumber}`}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-primary/20 text-primary-foreground border-primary/30"
                        >
                          Episódio #{formData.episode_number}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-xl">
                        {formData.name || `Episódio ${formData.episode_number}`}
                      </h3>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        formData.is_watched
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {formData.is_watched ? "✓ Assistido" : "Não Assistido"}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-gray-300">
                    {formData.duration > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formData.duration || 45} minutos</span>
                      </div>
                    )}

                    {formData.release_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(formData.release_date).toLocaleDateString(
                            "pt-PT",
                          )}
                        </span>
                      </div>
                    )}

                    {formData.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">
                          {formData.rating}/10
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-400">
                        Série: {seriesName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-3">
                  {(formData.would_recommend || formData.would_rewatch) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Preferências
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {formData.would_recommend && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                          >
                            Recomendaria
                          </Badge>
                        )}
                        {formData.would_rewatch && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"
                          >
                            Assistiria novamente
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.review && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Comentário
                      </p>
                      <p className="text-sm line-clamp-3 bg-muted/10 rounded p-2">
                        {formData.review}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card className="border-border/50 bg-linear-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Informações do Episódio
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

                <div className="pt-3">
                  <p className="font-medium text-foreground mb-1">
                    ID do Episódio
                  </p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {episode.id}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-red-700 dark:text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Zona de Perigo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Esta ação não pode ser desfeita. O episódio será
                  permanentemente removido.
                </p>

                <AlertDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir Episódio
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Episódio</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o episódio "
                        {episode.name || `Episódio ${episode.episode_number}`}
                        "?
                        <br />
                        <span className="font-semibold text-red-600">
                          Esta ação não pode ser desfeita.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isLoading}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading ? "Excluindo..." : "Excluir Permanentemente"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
