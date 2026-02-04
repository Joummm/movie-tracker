// components/series/forms/NewEpisodeForm.tsx
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
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  Star,
  X,
  Tv,
  Hash,
  Sparkles,
  Info,
  Plus,
  AlertCircle,
  CheckCircle,
  EyeOff,
  CalendarDays,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewEpisodeFormProps {
  userId: string;
  seriesId: string;
  seasonId: string;
  seriesName: string;
  seasonNumber: number;
  isSpecialSeason: boolean;
  nextEpisodeNumber: number;
}

export function NewEpisodeForm({
  userId,
  seriesId,
  seasonId,
  seriesName,
  seasonNumber,
  isSpecialSeason,
  nextEpisodeNumber,
}: NewEpisodeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [calculatedNextNumber, setCalculatedNextNumber] =
    useState(nextEpisodeNumber);

  // Buscar o verdadeiro último número de episódio
  useEffect(() => {
    const fetchLastEpisodeNumber = async () => {
      try {
        const { data: episodes, error } = await supabase
          .from("series_episodes")
          .select("episode_number")
          .eq("season_id", seasonId)
          .eq("series_id", seriesId)
          .order("episode_number", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Erro ao buscar último episódio:", error);
          return;
        }

        if (episodes && episodes.length > 0) {
          const lastNumber = episodes[0].episode_number;
          setCalculatedNextNumber(lastNumber + 1);
        } else {
          // Primeiro episódio da temporada
          setCalculatedNextNumber(1);
        }
      } catch (error) {
        console.error("Erro ao calcular próximo número:", error);
      }
    };

    fetchLastEpisodeNumber();
  }, [seasonId, seriesId, supabase]);

  const [formData, setFormData] = useState({
    episode_number: calculatedNextNumber.toString(),
    name: "",
    duration: 45,
    release_date: "",
    is_watched: false,
    rating: 0,
    review: "",
    would_recommend: false,
    would_rewatch: false,
    rewatch_count: 0,
    last_rewatch_date: "",
    // Campos para data de visualização
    watched_date_precision: "full", // 'year', 'month', 'full'
    watched_year: "",
    watched_month: "",
    watched_date: "",
  });

  // Atualizar o número do episódio quando calculatedNextNumber mudar
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      episode_number: calculatedNextNumber.toString(),
    }));
  }, [calculatedNextNumber]);

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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.episode_number) {
      toast.error("Número do episódio obrigatório", {
        description: "Por favor, insira o número do episódio.",
        duration: 4000,
      });
      return;
    }

    const episodeNumber = parseInt(formData.episode_number);
    if (isNaN(episodeNumber) || episodeNumber < 0) {
      toast.error("Número inválido", {
        description: "O número do episódio deve ser um valor válido.",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: seasonData, error: seasonError } = await supabase
        .from("series_seasons")
        .select("id, user_id")
        .eq("id", seasonId)
        .eq("user_id", userId)
        .single();

      if (seasonError || !seasonData) {
        throw new Error(
          "Não tem permissão para adicionar episódios a esta temporada",
        );
      }

      const { data: existingEpisode, error: checkError } = await supabase
        .from("series_episodes")
        .select("id, episode_number, name")
        .eq("season_id", seasonId)
        .eq("episode_number", episodeNumber)
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

      // Preparar dados do episódio
      const episodeData: any = {
        series_id: seriesId,
        season_id: seasonId,
        episode_number: episodeNumber,
        name: formData.name || null,
        duration: formData.duration > 0 ? formData.duration : null,
        release_date: formData.release_date || null,
        is_watched: formData.is_watched,
        rating: formData.rating > 0 ? formData.rating : null,
        review: formData.review || null,
        would_recommend: formData.would_recommend,
        would_rewatch: formData.would_rewatch,
        rewatch_count: formData.rewatch_count || 0,
        last_rewatch_date: formData.last_rewatch_date || null,
      };

      // Se foi assistido, adicionar data de visualização
      if (formData.is_watched) {
        if (
          formData.watched_date_precision === "full" &&
          formData.watched_date
        ) {
          episodeData.watched_date = formData.watched_date;
        } else if (
          formData.watched_date_precision === "month" &&
          formData.watched_month &&
          formData.watched_year
        ) {
          // Para precisão mês/ano, usar watched_date como YYYY-MM-01
          episodeData.watched_date = `${formData.watched_year}-${formData.watched_month.padStart(2, "0")}-01`;
        } else if (
          formData.watched_date_precision === "year" &&
          formData.watched_year
        ) {
          // Para precisão ano, usar watched_date como YYYY-01-01
          episodeData.watched_date = `${formData.watched_year}-01-01`;
        }
      }

      console.log("Criando episódio:", episodeData);

      const { data: newEpisode, error } = await supabase
        .from("series_episodes")
        .insert([episodeData])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar episódio:", error.message || error);

        // Verificar se é erro de constraint de unicidade
        if (
          error.message?.includes("duplicate key") ||
          error.message?.includes("unique constraint")
        ) {
          throw new Error(
            `Já existe um episódio com o número ${episodeNumber} nesta temporada. Por favor, use um número diferente.`,
          );
        }

        // Verificar se é erro de RLS
        if (
          error.message?.includes("row-level security") ||
          error.message?.includes("RLS")
        ) {
          // Tentar criar via conteúdo como fallback
          const contentEpisodeData = {
            user_id: userId,
            series_id: seriesId,
            season: seasonNumber,
            episode: episodeNumber,
            name: formData.name || null,
            duration: formData.duration > 0 ? formData.duration : null,
            type: "series_episode",
            watch_status: formData.is_watched ? "completed" : "not_started",
            rating: formData.rating > 0 ? formData.rating : null,
            review: formData.review || null,
            would_recommend: formData.would_recommend,
            would_rewatch: formData.would_rewatch,
          };

          const { data: contentEpisode, error: contentError } = await supabase
            .from("content")
            .insert([contentEpisodeData])
            .select()
            .single();

          if (contentError) {
            throw new Error(
              "Erro de permissão. Verifique as políticas de segurança da tabela.",
            );
          }

          // Criar relação no series_episodes depois
          const { error: episodeError } = await supabase
            .from("series_episodes")
            .insert([
              {
                ...episodeData,
                content_id: contentEpisode.id,
              },
            ]);

          if (episodeError) {
            console.warn(
              "Não foi possível criar relação no series_episodes:",
              episodeError,
            );
          }
        } else {
          throw error;
        }
      }

      console.log("Episódio criado com sucesso:", newEpisode || "via content");

      try {
        // Obter todos os episódios da temporada
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

      toast.success("Episódio criado com sucesso!", {
        description: `Episódio ${episodeNumber} "${formData.name || `Episódio ${episodeNumber}`}" adicionado à ${isSpecialSeason ? "Especial" : `Temporada ${seasonNumber}`}.`,
        duration: 4000,
      });

      // Redirecionar após 1.5 segundos
      setTimeout(() => {
        router.push(`/series/${seriesId}/seasons/${seasonId}`);
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao processar:", error.message || error);

      toast.error("Erro ao criar episódio", {
        description: error.message || "Ocorreu um erro inesperado.",
        duration: 5000,
      });

      setIsLoading(false);
    }
  };

  // Gera anos para o select (dos últimos 50 anos até o próximo ano)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 52 }, (_, i) => currentYear - 50 + i);

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/95">
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
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-blue-600 bg-clip-text text-transparent">
                  Novo Episódio
                </h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Adicione um novo episódio à "
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
                form="new-episode-form"
                disabled={isLoading}
                className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar Episódio
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
                        className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <Info className="h-4 w-4" />
                        <span>Básico</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="rating"
                        className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <Star className="h-4 w-4" />
                        <span>Avaliação</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="advanced"
                        className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Avançado</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Basic Tab */}
                  <TabsContent value="basic" className="m-0 p-4 md:p-6">
                    <form id="new-episode-form" onSubmit={handleSubmit}>
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
                            <div className="flex items-start gap-2 mt-2">
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                Próximo número sugerido: {calculatedNextNumber}.
                                Cada número deve ser único por temporada.
                              </p>
                            </div>
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

                        {/* Status de Visualização ATUALIZADO */}
                        <div className="bg-linear-to-br from-card to-card/80 rounded-lg border border-border/30 p-4">
                          <div className="flex items-center justify-between mb-4">
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
                                Já assistiu este episódio?
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
                            <div className="space-y-4 mt-4 p-3 bg-muted/20 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4" />
                                  Precisão da Data de Visualização
                                </Label>
                                <Select
                                  value={formData.watched_date_precision}
                                  onValueChange={(value) =>
                                    handleSelectChange(
                                      "watched_date_precision",
                                      value,
                                    )
                                  }
                                  disabled={isLoading}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione a precisão" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="full">
                                      Data Completa
                                    </SelectItem>
                                    <SelectItem value="month">
                                      Mês e Ano
                                    </SelectItem>
                                    <SelectItem value="year">
                                      Apenas Ano
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {formData.watched_date_precision === "full" && (
                                <div>
                                  <Label
                                    htmlFor="watched_date"
                                    className="text-sm"
                                  >
                                    Data de Visualização
                                  </Label>
                                  <Input
                                    id="watched_date"
                                    name="watched_date"
                                    type="date"
                                    value={
                                      formData.watched_date ||
                                      new Date().toISOString().split("T")[0]
                                    }
                                    onChange={handleInputChange}
                                    className="mt-1"
                                    disabled={isLoading}
                                  />
                                </div>
                              )}

                              {formData.watched_date_precision === "month" && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label
                                      htmlFor="watched_month"
                                      className="text-sm"
                                    >
                                      Mês
                                    </Label>
                                    <Select
                                      value={formData.watched_month}
                                      onValueChange={(value) =>
                                        handleSelectChange(
                                          "watched_month",
                                          value,
                                        )
                                      }
                                      disabled={isLoading}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o mês" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {months.map((month) => (
                                          <SelectItem
                                            key={month.value}
                                            value={month.value}
                                          >
                                            {month.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label
                                      htmlFor="watched_year"
                                      className="text-sm"
                                    >
                                      Ano
                                    </Label>
                                    <Select
                                      value={formData.watched_year}
                                      onValueChange={(value) =>
                                        handleSelectChange(
                                          "watched_year",
                                          value,
                                        )
                                      }
                                      disabled={isLoading}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o ano" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {years.map((year) => (
                                          <SelectItem
                                            key={year}
                                            value={year.toString()}
                                          >
                                            {year}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}

                              {formData.watched_date_precision === "year" && (
                                <div>
                                  <Label
                                    htmlFor="watched_year"
                                    className="text-sm"
                                  >
                                    Ano de Visualização
                                  </Label>
                                  <Select
                                    value={formData.watched_year}
                                    onValueChange={(value) =>
                                      handleSelectChange("watched_year", value)
                                    }
                                    disabled={isLoading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o ano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {years.map((year) => (
                                        <SelectItem
                                          key={year}
                                          value={year.toString()}
                                        >
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Rating Tab */}
                  <TabsContent value="rating" className="m-0 p-4 md:p-6">
                    <form id="new-episode-form" onSubmit={handleSubmit}>
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
                      </div>
                    </form>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="m-0 p-4 md:p-6">
                    <form id="new-episode-form" onSubmit={handleSubmit}>
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

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-emerald-500" />
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
                                <Sparkles className="h-4 w-4 text-blue-500" />
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
                </Tabs>
              </div>
            </Card>
          </div>

          {/* Preview & Info Section - 1/3 width */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  Como o episódio aparecerá após criação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        #{formData.episode_number || "1"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {formData.name ||
                          `Episódio ${formData.episode_number || "1"}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            formData.is_watched ? "default" : "secondary"
                          }
                          className={`text-xs ${formData.is_watched ? "bg-emerald-500 hover:bg-emerald-600" : "bg-yellow-500 hover:bg-yellow-600"}`}
                        >
                          {formData.is_watched
                            ? "✓ Assistido"
                            : "Não Assistido"}
                        </Badge>
                        {formData.duration > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {formData.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informações adicionais */}
                  <div className="space-y-2 text-sm">
                    {(formData.release_date || formData.rating > 0) && (
                      <div className="flex items-center gap-4">
                        {formData.release_date && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(
                                formData.release_date,
                              ).toLocaleDateString("pt-PT")}
                            </span>
                          </div>
                        )}
                        {formData.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="font-medium">
                              {formData.rating}/10
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data de visualização se aplicável */}
                    {formData.is_watched && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Visualizado em:
                        </p>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-sm">
                            {formData.watched_date_precision === "full" &&
                            formData.watched_date
                              ? new Date(
                                  formData.watched_date,
                                ).toLocaleDateString("pt-PT")
                              : formData.watched_date_precision === "month" &&
                                  formData.watched_month &&
                                  formData.watched_year
                                ? `${months.find((m) => m.value === formData.watched_month)?.label} ${formData.watched_year}`
                                : formData.watched_date_precision === "year" &&
                                    formData.watched_year
                                  ? formData.watched_year
                                  : "Data não especificada"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Preferências */}
                    {(formData.would_recommend || formData.would_rewatch) && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {formData.would_recommend && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                          >
                            Recomendaria
                          </Badge>
                        )}
                        {formData.would_rewatch && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-500/10 text-blue-700 border-blue-500/30"
                          >
                            Assistiria novamente
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Série */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Série:{" "}
                        <span className="font-medium text-foreground">
                          {seriesName}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isSpecialSeason
                          ? "Especial"
                          : `Temporada ${seasonNumber}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Temporada */}
            <Card className="border-border/50 bg-linear-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Informações da Temporada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Série</span>
                    <span className="font-medium truncate">{seriesName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Temporada</span>
                    <span className="font-medium">
                      {isSpecialSeason
                        ? "Especial"
                        : `Temporada ${seasonNumber}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Próximo episódio
                    </span>
                    <span className="font-medium">#{calculatedNextNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
