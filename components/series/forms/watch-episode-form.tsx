// components/series/forms/watch-episode-form.tsx - VERSÃO COM MELHOR TRATAMENTO DE ERROS
"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  Star,
  Save,
  X,
  Plus,
  Eye,
  Smartphone,
  Tv,
  Laptop,
  Tablet,
  GamepadIcon,
  Monitor,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WatchEpisodeFormProps {
  episode: any;
  seriesId: string;
  seasonId: string;
  userId: string;
  existingViewings: any[];
  watchSessions: any[];
}

export function WatchEpisodeForm({
  episode,
  seriesId,
  seasonId,
  userId,
  existingViewings,
  watchSessions,
}: WatchEpisodeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("quick");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRewatch, setIsRewatch] = useState(episode.is_watched);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    // Basic
    watched_date: format(new Date(), "yyyy-MM-dd"),
    date_precision: "full" as "full" | "month" | "year" | "unknown",
    date_unknown: false,

    // Rating
    rating: episode.rating || 0,
    review: "",

    // Platform
    platform: "",
    device: "",

    // Session
    watch_session_id: "",
    duration_watched: episode.duration || 0,

    // Advanced
    notes: "",
    would_recommend: episode.would_recommend || null,
    would_rewatch: episode.would_rewatch || null,
  });

  // Stats
  const [stats, setStats] = useState({
    totalViewings: existingViewings.length,
    firstWatched:
      existingViewings.length > 0
        ? new Date(
            existingViewings[existingViewings.length - 1].watched_date ||
              episode.created_at,
          )
        : null,
    lastWatched:
      existingViewings.length > 0
        ? new Date(existingViewings[0].watched_date || episode.created_at)
        : null,
    averageRating:
      existingViewings.reduce(
        (sum, viewing) => sum + (viewing.rating || 0),
        0,
      ) / (existingViewings.filter((v) => v.rating).length || 1),
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
    setError(null); // Limpa erro quando o usuário modifica algo
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Primeiro, precisamos verificar se o episódio existe na tabela series_episodes
      const { data: episodeExists } = await supabase
        .from("series_episodes")
        .select("id")
        .eq("id", episode.id)
        .single();

      let episodeIdForViewing = null;
      if (episodeExists) {
        episodeIdForViewing = episode.id;
      }

      // Obter o content_id relacionado
      let contentId = null;
      const { data: relatedContent } = await supabase
        .from("content")
        .select("id")
        .eq("series_id", seriesId)
        .eq(
          "season",
          (
            await supabase
              .from("series_seasons")
              .select("season_number")
              .eq("id", seasonId)
              .single()
          ).data?.season_number || 1,
        )
        .eq("episode", episode.episode_number)
        .eq("user_id", userId)
        .single();

      if (relatedContent) {
        contentId = relatedContent.id;
      } else {
        // Se não encontrar, crie um novo content
        const seasonNumber =
          (
            await supabase
              .from("series_seasons")
              .select("season_number")
              .eq("id", seasonId)
              .single()
          ).data?.season_number || 1;

        const { data: newContent } = await supabase
          .from("content")
          .insert([
            {
              user_id: userId,
              series_id: seriesId,
              season: seasonNumber,
              episode: episode.episode_number,
              name: episode.name || `Episódio ${episode.episode_number}`,
              type: "episode",
              watch_status: "completed",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (newContent) {
          contentId = newContent.id;
        }
      }

      if (!contentId) {
        throw new Error(
          "Não foi possível encontrar ou criar o conteúdo relacionado",
        );
      }

      const viewingData: any = {
        content_id: contentId,
        watched_date: formData.date_unknown ? null : formData.watched_date,
        watched_year: formData.date_unknown
          ? null
          : new Date(formData.watched_date).getFullYear(),
        watched_month: formData.date_unknown
          ? null
          : new Date(formData.watched_date).getMonth() + 1,
        date_precision: formData.date_unknown
          ? "unknown"
          : formData.date_precision,
        date_unknown: formData.date_unknown,
        rating: formData.rating > 0 ? formData.rating : null,
        notes: formData.notes || null,
        platform: formData.platform || null,
        device: formData.device || null,
        watch_session_id: formData.watch_session_id || null,
        duration_watched: formData.duration_watched || null,
        created_at: new Date().toISOString(),
      };

      // Só adiciona episode_id se existir na tabela series_episodes
      if (episodeIdForViewing) {
        viewingData.episode_id = episodeIdForViewing;
      }

      console.log("Inserting viewing data:", viewingData);

      // 1. Adicionar a visualização
      const { data: newViewing, error: viewingError } = await supabase
        .from("content_viewings")
        .insert([viewingData])
        .select()
        .single();

      if (viewingError) {
        console.error("Viewing error:", viewingError);
        throw viewingError;
      }

      console.log("New viewing created:", newViewing);

      // 2. Atualizar o episódio (se existir na tabela series_episodes)
      const newRewatchCount = (episode.rewatch_count || 0) + 1;

      if (episodeExists) {
        const episodeUpdate = {
          is_watched: true,
          rewatch_count: newRewatchCount,
          last_rewatch_date: formData.watched_date,
          rating: formData.rating > 0 ? formData.rating : episode.rating,
          review: formData.review || episode.review,
          would_recommend:
            formData.would_recommend !== null
              ? formData.would_recommend
              : episode.would_recommend,
          would_rewatch:
            formData.would_rewatch !== null
              ? formData.would_rewatch
              : episode.would_rewatch,
          updated_at: new Date().toISOString(),
        };

        console.log("Updating episode in series_episodes:", episodeUpdate);

        const { error: episodeError } = await supabase
          .from("series_episodes")
          .update(episodeUpdate)
          .eq("id", episode.id);

        if (episodeError) {
          console.error("Episode update error:", episodeError);
        }
      }

      // 3. Sempre atualizar a tabela content
      const { error: contentError } = await supabase
        .from("content")
        .update({
          watch_status: "completed",
          rewatch_count: newRewatchCount,
          last_rewatch_date: formData.watched_date,
          rating: formData.rating > 0 ? formData.rating : episode.rating,
          review: formData.review || episode.review,
          would_recommend:
            formData.would_recommend !== null
              ? formData.would_recommend
              : episode.would_recommend,
          would_rewatch:
            formData.would_rewatch !== null
              ? formData.would_rewatch
              : episode.would_rewatch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentId);

      if (contentError) {
        console.error("Content update error:", contentError);
      }

      // 4. Atualizar a temporada
      const { data: seasonData } = await supabase
        .from("series_seasons")
        .select("watched_episode_count, episode_count")
        .eq("id", seasonId)
        .single();

      if (seasonData) {
        const newWatchedCount =
          seasonData.watched_episode_count + (episode.is_watched ? 0 : 1);
        console.log("Updating season watched count:", newWatchedCount);

        await supabase
          .from("series_seasons")
          .update({
            watched_episode_count: newWatchedCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", seasonId);
      }

      alert(
        isRewatch
          ? "Visualização adicionada com sucesso!"
          : "Episódio marcado como assistido!",
      );
      router.push(
        `/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}`,
      );
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao marcar episódio:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Obter número da temporada
      const { data: seasonData } = await supabase
        .from("series_seasons")
        .select("season_number")
        .eq("id", seasonId)
        .single();

      const seasonNumber = seasonData?.season_number || 1;

      // Buscar content_id
      let contentId = episode.id;
      const { data: relatedContent } = await supabase
        .from("content")
        .select("id")
        .eq("series_id", seriesId)
        .eq("season", seasonNumber)
        .eq("episode", episode.episode_number)
        .eq("user_id", userId)
        .single();

      if (relatedContent) {
        contentId = relatedContent.id;
      } else {
        // Criar conteúdo se não existir
        const { data: newContent } = await supabase
          .from("content")
          .insert([
            {
              user_id: userId,
              series_id: seriesId,
              season: seasonNumber,
              episode: episode.episode_number,
              name: episode.name || `Episódio ${episode.episode_number}`,
              type: "episode",
              watch_status: "completed",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (newContent) {
          contentId = newContent.id;
        }
      }

      const viewingData: any = {
        content_id: contentId,
        watched_date: format(new Date(), "yyyy-MM-dd"),
        watched_year: new Date().getFullYear(),
        watched_month: new Date().getMonth() + 1,
        date_precision: "full",
        date_unknown: false,
        created_at: new Date().toISOString(),
      };

      // Tentar adicionar episode_id se possível
      try {
        const { error: testError } = await supabase
          .from("content_viewings")
          .select("episode_id")
          .limit(1);

        if (!testError || testError.code !== "42703") {
          viewingData.episode_id = episode.id;
        }
      } catch (e) {
        // Ignorar erro de coluna não existente
      }

      console.log("Quick submit viewing data:", viewingData);

      const { error: viewingError } = await supabase
        .from("content_viewings")
        .insert([viewingData]);

      if (viewingError) {
        throw new Error(`Erro ao salvar visualização: ${viewingError.message}`);
      }

      const newRewatchCount = (episode.rewatch_count || 0) + 1;
      const episodeUpdate = {
        is_watched: true,
        rewatch_count: newRewatchCount,
        last_rewatch_date: format(new Date(), "yyyy-MM-dd"),
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("series_episodes")
        .update(episodeUpdate)
        .eq("id", episode.id);

      alert("Episódio marcado como assistido!");
      router.push(
        `/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}`,
      );
    } catch (error: any) {
      console.error("Erro no submit rápido:", error);
      setError(error.message || "Ocorreu um erro desconhecido");
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const platforms = [
    { value: "netflix", label: "Netflix", icon: Tv },
    { value: "amazon", label: "Amazon Prime", icon: Monitor },
    { value: "disney", label: "Disney+", icon: Tv },
    { value: "hbo", label: "HBO Max", icon: Monitor },
    { value: "youtube", label: "YouTube", icon: Monitor },
    { value: "other", label: "Outro", icon: Tv },
  ];

  const devices = [
    { value: "smartphone", label: "Smartphone", icon: Smartphone },
    { value: "tablet", label: "Tablet", icon: Tablet },
    { value: "laptop", label: "Laptop", icon: Laptop },
    { value: "tv", label: "TV", icon: Tv },
    { value: "desktop", label: "Desktop", icon: Monitor },
    { value: "console", label: "Console", icon: GamepadIcon },
    { value: "other", label: "Outro", icon: Smartphone },
  ];

  const datePrecisionOptions = [
    { value: "full", label: "Data completa", description: "Dia, mês e ano" },
    { value: "month", label: "Mês e ano", description: "Apenas mês e ano" },
    { value: "year", label: "Apenas ano", description: "Apenas o ano" },
    {
      value: "unknown",
      label: "Desconhecida",
      description: "Não lembro a data",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isRewatch ? "Adicionar Visualização" : "Marcar como Assistido"}
          </h2>
          <p className="text-muted-foreground">
            {isRewatch
              ? `Esta é a ${(episode.rewatch_count || 0) + 1}ª vez que você assiste este episódio`
              : "Registre quando você assistiu este episódio"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isRewatch && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRewatch(true)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />É um Reassistir
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Rápido
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Detalhado
          </TabsTrigger>
        </TabsList>

        {/* Quick Tab */}
        <TabsContent value="quick" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Marcação Rápida</CardTitle>
              <CardDescription>
                Marque o episódio como assistido usando as configurações padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-semibold">
                      Configurações que serão usadas:
                    </h4>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>
                        • Data: Hoje (
                        {format(new Date(), "dd/MM/yyyy", { locale: pt })})
                      </li>
                      <li>• Sem avaliação adicionada</li>
                      <li>• Sem informações de plataforma/dispositivo</li>
                      <li>• Sem comentários</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleQuickSubmit}
                  disabled={isLoading}
                  size="lg"
                  className="flex-1"
                >
                  {isLoading ? "Marcando..." : "Marcar como Assistido"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("detailed")}
                  disabled={isLoading}
                  size="lg"
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Personalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Tab */}
        <TabsContent value="detailed" className="m-0">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Date Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Data de Visualização
                  </CardTitle>
                  <CardDescription>
                    Quando você assistiu este episódio?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="date_unknown" className="cursor-pointer">
                        Não lembro a data
                      </Label>
                      <Switch
                        id="date_unknown"
                        checked={formData.date_unknown}
                        onCheckedChange={(checked) =>
                          handleSwitchChange("date_unknown", checked)
                        }
                        disabled={isLoading}
                      />
                    </div>

                    {!formData.date_unknown && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="watched_date">Data</Label>
                          <Input
                            id="watched_date"
                            name="watched_date"
                            type="date"
                            value={formData.watched_date}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            max={format(new Date(), "yyyy-MM-dd")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date_precision">
                            Precisão da Data
                          </Label>
                          <Select
                            value={formData.date_precision}
                            onValueChange={(value: any) =>
                              setFormData({
                                ...formData,
                                date_precision: value,
                              })
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {datePrecisionOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <div>
                                    <div className="font-medium">
                                      {option.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {option.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rating Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Avaliação
                  </CardTitle>
                  <CardDescription>
                    Como você avalia este episódio?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating" className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Nota (0-10)
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="rating"
                        name="rating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={formData.rating}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="w-32"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          {[...Array(10)].map((_, i) => {
                            const starValue = i + 1;
                            const isFilled = formData.rating >= starValue;

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    rating: starValue,
                                  })
                                }
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-5 w-5 transition-all ${
                                    isFilled
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Comentários</Label>
                    <Textarea
                      id="review"
                      name="review"
                      value={formData.review}
                      onChange={handleInputChange}
                      placeholder="O que você achou deste episódio? Algum momento marcante?"
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Platform & Device */}
              <Card>
                <CardHeader>
                  <CardTitle>Plataforma e Dispositivo</CardTitle>
                  <CardDescription>Onde e como você assistiu?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform">Plataforma</Label>
                      <Select
                        value={formData.platform}
                        onValueChange={(value) =>
                          setFormData({ ...formData, platform: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a plataforma" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => {
                            const Icon = platform.icon;
                            return (
                              <SelectItem
                                key={platform.value}
                                value={platform.value}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {platform.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="device">Dispositivo</Label>
                      <Select
                        value={formData.device}
                        onValueChange={(value) =>
                          setFormData({ ...formData, device: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dispositivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map((device) => {
                            const Icon = device.icon;
                            return (
                              <SelectItem
                                key={device.value}
                                value={device.value}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {device.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.platform === "other" && (
                    <Input
                      placeholder="Qual plataforma?"
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  )}

                  {formData.device === "other" && (
                    <Input
                      placeholder="Qual dispositivo?"
                      value={formData.device}
                      onChange={(e) =>
                        setFormData({ ...formData, device: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-center"
                >
                  {showAdvanced
                    ? "Ocultar opções avançadas"
                    : "Mostrar opções avançadas"}
                </Button>

                {showAdvanced && (
                  <div className="mt-4 space-y-6">
                    {/* Duration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Duração Assistida
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="duration_watched">
                            Quantos minutos você assistiu? (opcional)
                          </Label>
                          <Input
                            id="duration_watched"
                            name="duration_watched"
                            type="number"
                            min="0"
                            value={formData.duration_watched}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder={`Duração total: ${episode.duration || "?"} minutos`}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Watch Session */}
                    {watchSessions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Sessão de Visualização</CardTitle>
                          <CardDescription>
                            Vincule a uma sessão existente
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Select
                            value={formData.watch_session_id}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                watch_session_id: value,
                              })
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma sessão" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Nenhuma sessão</SelectItem>
                              {watchSessions.map((session) => (
                                <SelectItem key={session.id} value={session.id}>
                                  <div>
                                    <div className="font-medium">
                                      {format(
                                        new Date(session.start_time),
                                        "dd/MM/yyyy HH:mm",
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {session.platform} • {session.device}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    )}

                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Notas Adicionais</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Adicione notas sobre esta visualização específica..."
                          rows={3}
                          disabled={isLoading}
                        />
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recomendações</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="would_recommend"
                            className="cursor-pointer"
                          >
                            Recomendaria este episódio?
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={
                                formData.would_recommend === true
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  would_recommend: true,
                                })
                              }
                              disabled={isLoading}
                            >
                              Sim
                            </Button>
                            <Button
                              type="button"
                              variant={
                                formData.would_recommend === false
                                  ? "destructive"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  would_recommend: false,
                                })
                              }
                              disabled={isLoading}
                            >
                              Não
                            </Button>
                            <Button
                              type="button"
                              variant={
                                formData.would_recommend === null
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  would_recommend: null,
                                })
                              }
                              disabled={isLoading}
                            >
                              -
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="would_rewatch"
                            className="cursor-pointer"
                          >
                            Assistiria novamente?
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={
                                formData.would_rewatch === true
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  would_rewatch: true,
                                })
                              }
                              disabled={isLoading}
                            >
                              Sim
                            </Button>
                            <Button
                              type="button"
                              variant={
                                formData.would_rewatch === false
                                  ? "destructive"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  would_rewatch: false,
                                })
                              }
                              disabled={isLoading}
                            >
                              Não
                            </Button>
                            <Button
                              type="button"
                              variant={
                                formData.would_rewatch === null
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  would_rewatch: null,
                                })
                              }
                              disabled={isLoading}
                            >
                              -
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Stats */}
              {existingViewings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Estatísticas de Visualização
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {stats.totalViewings}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Visualizações
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {stats.averageRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Média
                        </div>
                      </div>
                      {stats.firstWatched && (
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {format(stats.firstWatched, "MMM/yy", {
                              locale: pt,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Primeira vez
                          </div>
                        </div>
                      )}
                      {stats.lastWatched && (
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {format(stats.lastWatched, "MMM/yy", {
                              locale: pt,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Última vez
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Save className="h-4 w-4" />
                  {isLoading
                    ? "Salvando..."
                    : isRewatch
                      ? "Adicionar Visualização"
                      : "Marcar como Assistido"}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
