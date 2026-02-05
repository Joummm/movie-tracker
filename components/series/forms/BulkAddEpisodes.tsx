// components/series/forms/BulkAddEpisodes.tsx
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
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Plus,
  X,
  Layers,
  Calendar,
  Clock,
  Star,
  Tv,
  Hash,
  AlertCircle,
  CheckCircle,
  EyeOff,
  FileText,
  SaveAll,
  Sparkles,
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

interface EpisodeFormData {
  episode_number: number;
  name: string;
  duration: number;
  release_date: string;
  is_watched: boolean;
  rating: number;
  review: string;
  would_recommend: boolean;
  would_rewatch: boolean;
}

interface BulkAddEpisodesProps {
  userId: string;
  seriesId: string;
  seasonId: string;
  seriesName: string;
  seasonNumber: number;
  isSpecialSeason: boolean;
  nextEpisodeNumber: number;
}

export function BulkAddEpisodes({
  userId,
  seriesId,
  seasonId,
  seriesName,
  seasonNumber,
  isSpecialSeason,
  nextEpisodeNumber,
}: BulkAddEpisodesProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [episodeCount, setEpisodeCount] = useState(5);
  const [calculatedNextNumber, setCalculatedNextNumber] =
    useState(nextEpisodeNumber);

  const [baseData, setBaseData] = useState({
    // Base data that applies to all episodes
    name_prefix: "",
    duration: 45,
    release_date: "",
    is_watched: false,
    rating: 0,
    review: "",
    would_recommend: false,
    would_rewatch: false,
    // Date precision
    watched_date_precision: "full",
    watched_year: new Date().getFullYear().toString(),
    watched_month: (new Date().getMonth() + 1).toString().padStart(2, "0"),
    watched_date: new Date().toISOString().split("T")[0],
  });

  const [episodes, setEpisodes] = useState<EpisodeFormData[]>([]);

  // Initialize episodes based on count
  useEffect(() => {
    const newEpisodes: EpisodeFormData[] = [];
    for (let i = 0; i < episodeCount; i++) {
      newEpisodes.push({
        episode_number: calculatedNextNumber + i,
        name: baseData.name_prefix
          ? `${baseData.name_prefix} ${i + 1}`
          : `Episódio ${calculatedNextNumber + i}`,
        duration: baseData.duration,
        release_date: baseData.release_date,
        is_watched: baseData.is_watched,
        rating: baseData.rating,
        review: baseData.review,
        would_recommend: baseData.would_recommend,
        would_rewatch: baseData.would_rewatch,
      });
    }
    setEpisodes(newEpisodes);
  }, [episodeCount, calculatedNextNumber, baseData]);

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

  const handleBaseInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setBaseData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setBaseData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBaseSwitchChange = (name: string, checked: boolean) => {
    setBaseData((prev) => ({
      ...prev,
      [name]: checked,
    }));

    // Update all episodes with this change
    setEpisodes((prevEpisodes) =>
      prevEpisodes.map((episode) => ({
        ...episode,
        [name]: checked,
      })),
    );
  };

  const handleBaseSelectChange = (name: string, value: string) => {
    setBaseData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEpisodeChange = (
    index: number,
    field: keyof EpisodeFormData,
    value: any,
  ) => {
    setEpisodes((prevEpisodes) => {
      const newEpisodes = [...prevEpisodes];
      newEpisodes[index] = {
        ...newEpisodes[index],
        [field]: value,
      };
      return newEpisodes;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate episodes
      const episodeNumbers = episodes.map((ep) => ep.episode_number);
      const hasDuplicates =
        new Set(episodeNumbers).size !== episodeNumbers.length;
      if (hasDuplicates) {
        throw new Error(
          "Há números de episódio duplicados. Por favor, verifique os números.",
        );
      }

      // Check for existing episodes
      const { data: existingEpisodes } = await supabase
        .from("series_episodes")
        .select("episode_number")
        .eq("season_id", seasonId)
        .eq("series_id", seriesId)
        .in("episode_number", episodeNumbers);

      if (existingEpisodes && existingEpisodes.length > 0) {
        const existingNumbers = existingEpisodes.map((ep) => ep.episode_number);
        throw new Error(
          `Já existem episódios com os números: ${existingNumbers.join(", ")}. Por favor, use números diferentes.`,
        );
      }

      // Prepare episodes data
      const episodesData = episodes.map((episode) => {
        const episodeData: any = {
          series_id: seriesId,
          season_id: seasonId,
          episode_number: episode.episode_number,
          name: episode.name || null,
          duration: episode.duration > 0 ? episode.duration : null,
          release_date: episode.release_date || null,
          is_watched: episode.is_watched,
          rating: episode.rating > 0 ? episode.rating : null,
          review: episode.review || null,
          would_recommend: episode.would_recommend,
          would_rewatch: episode.would_rewatch,
        };

        // Add watched date if applicable
        if (episode.is_watched) {
          if (
            baseData.watched_date_precision === "full" &&
            baseData.watched_date
          ) {
            episodeData.watched_date = baseData.watched_date;
          } else if (
            baseData.watched_date_precision === "month" &&
            baseData.watched_month &&
            baseData.watched_year
          ) {
            episodeData.watched_date = `${baseData.watched_year}-${baseData.watched_month.padStart(2, "0")}-01`;
          } else if (
            baseData.watched_date_precision === "year" &&
            baseData.watched_year
          ) {
            episodeData.watched_date = `${baseData.watched_year}-01-01`;
          }
        }

        return episodeData;
      });

      console.log("Criando episódios em lote:", episodesData);

      // Insert all episodes
      const { data: newEpisodes, error } = await supabase
        .from("series_episodes")
        .insert(episodesData)
        .select();

      if (error) {
        console.error("Erro ao criar episódios:", error.message || error);
        throw error;
      }

      console.log("Episódios criados com sucesso:", newEpisodes);

      // Update season statistics
      try {
        const { data: allEpisodes } = await supabase
          .from("series_episodes")
          .select("id, is_watched, rating, duration")
          .eq("season_id", seasonId);

        if (allEpisodes) {
          const totalEpisodes = allEpisodes.length;
          const watchedEpisodes = allEpisodes.filter(
            (ep) => ep.is_watched,
          ).length;
          const totalWatchTime = allEpisodes.reduce(
            (sum, ep) => sum + (ep.duration || 0),
            0,
          );
          const ratedEpisodes = allEpisodes.filter(
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

      toast.success("Episódios criados com sucesso!", {
        description: `${episodesData.length} episódios foram adicionados à ${isSpecialSeason ? "Especial" : `Temporada ${seasonNumber}`}.`,
        duration: 4000,
      });

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/series/${seriesId}/seasons/${seasonId}/episodes`);
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao processar:", error.message || error);

      toast.error("Erro ao criar episódios", {
        description: error.message || "Ocorreu um erro inesperado.",
        duration: 5000,
      });

      setIsLoading(false);
    }
  };

  // Generate years for select
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
              router.push(`/series/${seriesId}/seasons/${seasonId}/episodes`)
            }
            className="mb-6 gap-2 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para temporada
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-linear-to-br from-primary/10 to-primary/5">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-blue-600 bg-clip-text text-transparent">
                  Adicionar Vários Episódios
                </h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Crie vários episódios de uma vez para "
                <span className="font-semibold text-primary">{seriesName}</span>
                " - {isSpecialSeason ? "Especial" : `Temporada ${seasonNumber}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/series/${seriesId}/seasons/${seasonId}/episodes`,
                  )
                }
                disabled={isLoading}
                className="gap-2 border-border/50 hover:border-primary/30"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                form="bulk-add-form"
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
                    <SaveAll className="h-4 w-4" />
                    Criar {episodeCount} Episódios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <form id="bulk-add-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuração Base - 1/3 width */}
            <div className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardHeader className="bg-linear-to-r from-primary/5 via-primary/5 to-transparent border-b border-border/30">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Configuração Base
                  </CardTitle>
                  <CardDescription>
                    Configurações que se aplicam a todos os episódios
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Episode Count */}
                  <div>
                    <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      Número de Episódios
                    </Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setEpisodeCount(Math.max(1, episodeCount - 1))
                        }
                        disabled={episodeCount <= 1}
                        className="h-10 w-10"
                      >
                        -
                      </Button>
                      <div className="flex-1 text-center">
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={episodeCount}
                          onChange={(e) =>
                            setEpisodeCount(
                              Math.min(
                                50,
                                Math.max(1, parseInt(e.target.value) || 1),
                              ),
                            )
                          }
                          className="text-center text-lg font-semibold"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          De {calculatedNextNumber} a{" "}
                          {calculatedNextNumber + episodeCount - 1}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setEpisodeCount(Math.min(50, episodeCount + 1))
                        }
                        disabled={episodeCount >= 50}
                        className="h-10 w-10"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Name Prefix */}
                  <div>
                    <Label
                      htmlFor="name_prefix"
                      className="text-base font-semibold mb-2 flex items-center gap-2"
                    >
                      <Tv className="h-4 w-4 text-primary" />
                      Prefixo do Nome (opcional)
                    </Label>
                    <Input
                      id="name_prefix"
                      name="name_prefix"
                      value={baseData.name_prefix}
                      onChange={handleBaseInputChange}
                      placeholder="Ex: Episódio, Capítulo, Parte"
                      className="border-border/50"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Será usado como:{" "}
                      <span className="font-medium">
                        {baseData.name_prefix || "Episódio"} [número]
                      </span>
                    </p>
                  </div>

                  {/* Duration */}
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
                      value={baseData.duration}
                      onChange={handleBaseInputChange}
                      placeholder="45"
                      className="border-border/50"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Release Date */}
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
                      value={baseData.release_date}
                      onChange={handleBaseInputChange}
                      className="border-border/50"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <Label
                      htmlFor="rating"
                      className="text-base font-semibold mb-2 flex items-center gap-2"
                    >
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      Avaliação (0-10)
                    </Label>
                    <Input
                      id="rating"
                      name="rating"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={baseData.rating}
                      onChange={handleBaseInputChange}
                      placeholder="0"
                      className="border-border/50"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Deixe 0 para não avaliar
                    </p>
                  </div>

                  <Separator />

                  {/* Status de Visualização */}
                  <div className="bg-linear-to-br from-card to-card/80 rounded-lg border border-border/30 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          {baseData.is_watched ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-yellow-500" />
                          )}
                          Status de Visualização
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Já assistiu estes episódios?
                        </p>
                      </div>
                      <Switch
                        id="is_watched"
                        checked={baseData.is_watched}
                        onCheckedChange={(checked) =>
                          handleBaseSwitchChange("is_watched", checked)
                        }
                        disabled={isLoading}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>

                    {baseData.is_watched && (
                      <div className="space-y-4 mt-4 p-3 bg-muted/20 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium mb-2">
                            Precisão da Data de Visualização
                          </Label>
                          <Select
                            value={baseData.watched_date_precision}
                            onValueChange={(value) =>
                              handleBaseSelectChange(
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
                              <SelectItem value="month">Mês e Ano</SelectItem>
                              <SelectItem value="year">Apenas Ano</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {baseData.watched_date_precision === "full" && (
                          <div>
                            <Label htmlFor="watched_date" className="text-sm">
                              Data de Visualização
                            </Label>
                            <Input
                              id="watched_date"
                              name="watched_date"
                              type="date"
                              value={baseData.watched_date}
                              onChange={handleBaseInputChange}
                              className="mt-1"
                              disabled={isLoading}
                            />
                          </div>
                        )}

                        {baseData.watched_date_precision === "month" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="watched_month"
                                className="text-sm"
                              >
                                Mês
                              </Label>
                              <Select
                                value={baseData.watched_month}
                                onValueChange={(value) =>
                                  handleBaseSelectChange("watched_month", value)
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
                              <Label htmlFor="watched_year" className="text-sm">
                                Ano
                              </Label>
                              <Select
                                value={baseData.watched_year}
                                onValueChange={(value) =>
                                  handleBaseSelectChange("watched_year", value)
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

                        {baseData.watched_date_precision === "year" && (
                          <div>
                            <Label htmlFor="watched_year" className="text-sm">
                              Ano de Visualização
                            </Label>
                            <Select
                              value={baseData.watched_year}
                              onValueChange={(value) =>
                                handleBaseSelectChange("watched_year", value)
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

                  {/* Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Recomendaria estes episódios?
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recomendaria a outros utilizadores?
                        </p>
                      </div>
                      <Switch
                        id="would_recommend"
                        checked={baseData.would_recommend}
                        onCheckedChange={(checked) =>
                          handleBaseSwitchChange("would_recommend", checked)
                        }
                        disabled={isLoading}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          Assistiria novamente?
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Veria estes episódios novamente no futuro?
                        </p>
                      </div>
                      <Switch
                        id="would_rewatch"
                        checked={baseData.would_rewatch}
                        onCheckedChange={(checked) =>
                          handleBaseSwitchChange("would_rewatch", checked)
                        }
                        disabled={isLoading}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Information Card */}
              <Card className="border-border/50 bg-linear-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Informações Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2 text-muted-foreground">
                    <p>• Os episódios serão numerados automaticamente</p>
                    <p>• Pode editar cada episódio individualmente depois</p>
                    <p>
                      • Use esta funcionalidade para criar uma temporada
                      completa
                    </p>
                    <p>• Números de episódio duplicados não são permitidos</p>
                  </div>
                  <div className="pt-3 border-t border-border/30">
                    <p className="font-medium text-foreground mb-1">
                      Configuração Atual
                    </p>
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-muted-foreground">Série:</span>{" "}
                        <span className="font-medium">{seriesName}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Temporada:
                        </span>{" "}
                        <span className="font-medium">
                          {isSpecialSeason
                            ? "Especial"
                            : `Temporada ${seasonNumber}`}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Episódios a criar:
                        </span>{" "}
                        <span className="font-medium">{episodeCount}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Iniciando em:
                        </span>{" "}
                        <span className="font-medium">
                          #{calculatedNextNumber}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Episodes List - 2/3 width */}
            <div className="lg:col-span-2">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardHeader className="bg-linear-to-r from-primary/5 via-primary/5 to-transparent border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Pré-visualização dos Episódios
                      </CardTitle>
                      <CardDescription>
                        {episodeCount} episódios serão criados
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      #{calculatedNextNumber} → #
                      {calculatedNextNumber + episodeCount - 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {episodes.map((episode, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border border-border/30 bg-card/50 hover:bg-card/70 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="font-bold text-lg">
                                #{episode.episode_number}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            {/* Episode Name */}
                            <div>
                              <Label className="text-sm font-medium mb-1">
                                Nome do Episódio
                              </Label>
                              <Input
                                value={episode.name}
                                onChange={(e) =>
                                  handleEpisodeChange(
                                    index,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                placeholder={`Episódio ${episode.episode_number}`}
                                className="border-border/50"
                                disabled={isLoading}
                              />
                            </div>

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    episode.is_watched ? "default" : "secondary"
                                  }
                                  className={`text-xs ${episode.is_watched ? "bg-emerald-500 hover:bg-emerald-600" : "bg-yellow-500 hover:bg-yellow-600"}`}
                                >
                                  {episode.is_watched
                                    ? "✓ Assistido"
                                    : "Não Assistido"}
                                </Badge>
                              </div>
                              {episode.duration > 0 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  {episode.duration} min
                                </div>
                              )}
                              {episode.rating > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                  {episode.rating}/10
                                </div>
                              )}
                            </div>

                            {/* Custom Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">
                                  Duração Personalizada
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={episode.duration}
                                  onChange={(e) =>
                                    handleEpisodeChange(
                                      index,
                                      "duration",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  placeholder={baseData.duration.toString()}
                                  className="h-8 text-sm"
                                  disabled={isLoading}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">
                                  Avaliação Personalizada
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={episode.rating}
                                  onChange={(e) =>
                                    handleEpisodeChange(
                                      index,
                                      "rating",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  placeholder={baseData.rating.toString()}
                                  className="h-8 text-sm"
                                  disabled={isLoading}
                                />
                              </div>
                              {/* NOVO CAMPO - Data de Lançamento Personalizada */}
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1">
                                  Data Lançamento Personalizada
                                </Label>
                                <Input
                                  type="date"
                                  value={episode.release_date || ""}
                                  onChange={(e) =>
                                    handleEpisodeChange(
                                      index,
                                      "release_date",
                                      e.target.value || "",
                                    )
                                  }
                                  className="h-8 text-sm"
                                  disabled={isLoading}
                                />
                              </div>
                            </div>

                            {/* Individual Review */}
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1">
                                Crítica Individual (opcional)
                              </Label>
                              <Textarea
                                value={episode.review}
                                onChange={(e) =>
                                  handleEpisodeChange(
                                    index,
                                    "review",
                                    e.target.value,
                                  )
                                }
                                placeholder="Crítica específica para este episódio..."
                                rows={2}
                                className="text-sm border-border/50 resize-none"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-linear-to-r from-primary/5 via-primary/5 to-transparent rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Resumo</p>
                        <p className="text-sm text-muted-foreground">
                          {episodeCount} episódios serão criados
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          #{calculatedNextNumber} → #
                          {calculatedNextNumber + episodeCount - 1}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {seriesName}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
