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
  Minus,
  Check,
  Copy,
  Trash2,
  Settings,
  Wand2,
  ChevronDown,
  ChevronUp,
  Eye,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

interface EpisodeFormData {
  episode_number: number;
  name: string;
  duration: number;
  release_date: string;
  is_watched: boolean;
  rating: number;
  review: string;
  would_recommend: boolean | null;
  would_rewatch: boolean | null;
  watched_date?: string;
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
  const [activeTab, setActiveTab] = useState("quick");
  const [expandedEpisodes, setExpandedEpisodes] = useState<number[]>([]);

  const [baseData, setBaseData] = useState({
    name_prefix: "",
    duration: 45,
    release_date: "",
    is_watched: false,
    rating: 0,
    review: "",
    would_recommend: null as boolean | null,
    would_rewatch: null as boolean | null,
    watched_date: new Date().toISOString().split("T")[0],
  });

  const [episodes, setEpisodes] = useState<EpisodeFormData[]>([]);

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
          setCalculatedNextNumber(1);
        }
      } catch (error) {
        console.error("Erro ao calcular próximo número:", error);
      }
    };

    fetchLastEpisodeNumber();
  }, [seasonId, seriesId, supabase]);

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
        watched_date: baseData.is_watched ? baseData.watched_date : undefined,
      });
    }
    setEpisodes(newEpisodes);
    setExpandedEpisodes([]); // Reset expanded episodes when count changes
  }, [episodeCount, calculatedNextNumber, baseData]);

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

    // If watched date changes, update episodes
    if (name === "watched_date" && baseData.is_watched) {
      setEpisodes((prevEpisodes) =>
        prevEpisodes.map((episode) => ({
          ...episode,
          watched_date: episode.is_watched ? value : undefined,
        })),
      );
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
        watched_date:
          name === "is_watched" && checked ? baseData.watched_date : undefined,
      })),
    );
  };

  const handleBaseThreeWayToggle = (name: string, value: boolean | null) => {
    setBaseData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update all episodes with this change
    setEpisodes((prevEpisodes) =>
      prevEpisodes.map((episode) => ({
        ...episode,
        [name]: value,
      })),
    );
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

  const handleEpisodeThreeWayToggle = (
    index: number,
    field: keyof EpisodeFormData,
    value: boolean | null,
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

  const toggleEpisodeExpanded = (index: number) => {
    setExpandedEpisodes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const applyToAll = (field: keyof EpisodeFormData, value: any) => {
    setEpisodes((prevEpisodes) =>
      prevEpisodes.map((episode) => ({
        ...episode,
        [field]: value,
      })),
    );
  };

  const copyFromPrevious = (index: number) => {
    if (index === 0) return;

    setEpisodes((prevEpisodes) => {
      const newEpisodes = [...prevEpisodes];
      const previousEpisode = prevEpisodes[index - 1];

      newEpisodes[index] = {
        ...newEpisodes[index],
        duration: previousEpisode.duration,
        rating: previousEpisode.rating,
        review: previousEpisode.review,
        would_recommend: previousEpisode.would_recommend,
        would_rewatch: previousEpisode.would_rewatch,
      };

      return newEpisodes;
    });

    toast.success("Copiado do episódio anterior", {
      description: "As configurações foram copiadas.",
      duration: 2000,
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
          last_rewatch_date:
            episode.is_watched && episode.watched_date
              ? episode.watched_date
              : null,
        };

        return episodeData;
      });

      // Insert all episodes
      const { data: newEpisodes, error } = await supabase
        .from("series_episodes")
        .insert(episodesData)
        .select();

      if (error) {
        console.error("Erro ao criar episódios:", error.message || error);
        throw error;
      }

      // Se os episódios foram marcados como assistidos, criar registros na tabela content
      if (baseData.is_watched) {
        try {
          for (const episode of episodes) {
            if (episode.is_watched && episode.watched_date) {
              const { error: contentError } = await supabase
                .from("content")
                .insert({
                  user_id: userId,
                  name: episode.name || `Episódio ${episode.episode_number}`,
                  series_id: seriesId,
                  season_id: seasonId,
                  episode_number: episode.episode_number,
                  type: "episode",
                  watch_status: "completed",
                  watched_date: episode.watched_date,
                  rating: episode.rating > 0 ? episode.rating : null,
                  review: episode.review || null,
                  would_recommend: episode.would_recommend,
                  would_rewatch: episode.would_rewatch,
                  duration: episode.duration > 0 ? episode.duration : null,
                });

              if (contentError) {
                console.warn(
                  "Não foi possível criar registro de visualização:",
                  contentError,
                );
              }
            }
          }
        } catch (contentError) {
          console.warn(
            "Erro ao criar registros de visualização:",
            contentError,
          );
        }
      }

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

  // Helper function to render three-way toggle
  const renderThreeWayToggle = (
    label: string,
    description: string,
    name: "would_recommend" | "would_rewatch",
    value: boolean | null,
    onValueChange: (value: boolean | null) => void,
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
          onClick={() => onValueChange(null)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${value === null ? `${colorClass} text-white` : "bg-background hover:bg-muted"}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onValueChange(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${value === false ? "bg-destructive text-destructive-foreground" : "bg-background hover:bg-muted"}`}
        >
          <X className="h-4 w-4" />
          Não
        </button>
        <button
          type="button"
          onClick={() => onValueChange(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${value === true ? `${colorClass} text-white` : "bg-background hover:bg-muted"}`}
        >
          <Check className="h-4 w-4" />
          Sim
        </button>
      </div>
    </div>
  );

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Configuração Base - 1/3 width */}
            <div className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardHeader className="from-primary/5 via-primary/5 to-transparent border-b ">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Configuração Base
                  </CardTitle>
                  <CardDescription>
                    Configurações que se aplicam a todos os episódios
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="quick">Rápido</TabsTrigger>
                      <TabsTrigger value="advanced">Avançado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="quick" className="space-y-6 mt-4">
                      {/* Episode Count - Quick Control */}
                      <div>
                        <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          Número de Episódios
                        </Label>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Quantidade</span>
                            <span className="font-bold text-lg">
                              {episodeCount}
                            </span>
                          </div>
                          <Slider
                            value={[episodeCount]}
                            onValueChange={([value]) => setEpisodeCount(value)}
                            min={1}
                            max={20}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>1</span>
                            <span>5</span>
                            <span>10</span>
                            <span>15</span>
                            <span>20</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Settings */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2">
                            Nome Base
                          </Label>
                          <Input
                            value={baseData.name_prefix}
                            onChange={(e) =>
                              setBaseData((prev) => ({
                                ...prev,
                                name_prefix: e.target.value,
                              }))
                            }
                            placeholder="Ex: Capítulo, Parte, Episódio"
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2">
                            Duração Padrão
                          </Label>
                          <div className="flex gap-2">
                            {[30, 45, 60, 90].map((duration) => (
                              <Button
                                key={duration}
                                type="button"
                                variant={
                                  baseData.duration === duration
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setBaseData((prev) => ({ ...prev, duration }))
                                }
                                className="flex-1"
                              >
                                {duration} min
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Quick Watched Toggle */}
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            {baseData.is_watched ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <EyeOff className="h-5 w-5 text-yellow-500" />
                            )}
                            <div>
                              <p className="font-medium">
                                Marcar como Assistidos
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {baseData.is_watched
                                  ? "Com data de hoje"
                                  : "Não assistidos"}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={baseData.is_watched}
                            onCheckedChange={(checked) =>
                              handleBaseSwitchChange("is_watched", checked)
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-6 mt-4">
                      {/* Episode Count - Advanced */}
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
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Episódios #{calculatedNextNumber} a #
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
                        <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                          <Tv className="h-4 w-4 text-primary" />
                          Prefixo do Nome
                        </Label>
                        <Input
                          value={baseData.name_prefix}
                          onChange={(e) =>
                            setBaseData((prev) => ({
                              ...prev,
                              name_prefix: e.target.value,
                            }))
                          }
                          placeholder="Ex: Episódio, Capítulo, Parte"
                          className="border-border/50"
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
                        <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          Duração (minutos)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={baseData.duration}
                          onChange={(e) =>
                            setBaseData((prev) => ({
                              ...prev,
                              duration: parseInt(e.target.value) || 0,
                            }))
                          }
                          placeholder="45"
                          className="border-border/50"
                        />
                      </div>

                      {/* Release Date */}
                      <div>
                        <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Data de Lançamento
                        </Label>
                        <Input
                          type="date"
                          value={baseData.release_date}
                          onChange={(e) =>
                            setBaseData((prev) => ({
                              ...prev,
                              release_date: e.target.value,
                            }))
                          }
                          className="border-border/50"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  {/* Status de Visualização */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
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
                        checked={baseData.is_watched}
                        onCheckedChange={(checked) =>
                          handleBaseSwitchChange("is_watched", checked)
                        }
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>

                    {baseData.is_watched && (
                      <div className="space-y-4 p-3 bg-muted/20 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium mb-2">
                            Data de Visualização
                          </Label>
                          <Input
                            type="date"
                            value={baseData.watched_date}
                            onChange={handleBaseInputChange}
                            name="watched_date"
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Esta data será aplicada a todos os episódios
                            marcados como assistidos
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2">
                            Avaliação Padrão (0-10)
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={baseData.rating}
                              onChange={handleBaseInputChange}
                              name="rating"
                              placeholder="0"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                applyToAll("rating", baseData.rating)
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2">
                            Crítica Padrão
                          </Label>
                          <Textarea
                            value={baseData.review}
                            onChange={handleBaseInputChange}
                            name="review"
                            placeholder="Crítica que se aplica a todos os episódios..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preferences */}
                  <div className="space-y-6">
                    {renderThreeWayToggle(
                      "Recomendaria estes episódios?",
                      "Recomendaria a outros utilizadores?",
                      "would_recommend",
                      baseData.would_recommend,
                      (value) =>
                        handleBaseThreeWayToggle("would_recommend", value),
                      <CheckCircle className="h-4 w-4 text-emerald-500" />,
                      "bg-emerald-500",
                    )}

                    {renderThreeWayToggle(
                      "Assistiria novamente?",
                      "Veria estes episódios novamente no futuro?",
                      "would_rewatch",
                      baseData.would_rewatch,
                      (value) =>
                        handleBaseThreeWayToggle("would_rewatch", value),
                      <CheckCircle className="h-4 w-4 text-blue-500" />,
                      "bg-blue-500",
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ações Rápidas</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date().toISOString().split("T")[0];
                          setBaseData((prev) => ({
                            ...prev,
                            watched_date: today,
                          }));
                          applyToAll("watched_date", today);
                        }}
                        className="gap-1 text-xs"
                      >
                        <CalendarDays className="h-3 w-3" />
                        Data Hoje
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyToAll("rating", 0)}
                        className="gap-1 text-xs"
                      >
                        <Star className="h-3 w-3" />
                        Sem Avaliação
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyToAll("review", "")}
                        className="gap-1 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        Limpar Críticas
                      </Button>
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
                      <p>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="font-medium">
                          {baseData.is_watched
                            ? "Assistidos"
                            : "Não Assistidos"}
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
                <CardHeader className=" from-primary/5 via-primary/5 to-transparent  ">
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
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          expandedEpisodes.includes(index)
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/30 bg-card/50 hover:bg-card/70"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="shrink-0">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                episode.is_watched
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              <span className="font-bold text-lg">
                                #{episode.episode_number}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            {/* Episode Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
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
                                    className="text-lg font-semibold border-none bg-transparent p-0 hover:bg-muted/50 focus:bg-background focus:border"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleEpisodeExpanded(index)}
                                    className="h-7 w-7 p-0"
                                  >
                                    {expandedEpisodes.includes(index) ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>

                                {/* Quick Info */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant={
                                      episode.is_watched
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={`text-xs ${episode.is_watched ? "bg-emerald-500 hover:bg-emerald-600" : "bg-yellow-500 hover:bg-yellow-600"}`}
                                  >
                                    {episode.is_watched
                                      ? "✓ Assistido"
                                      : "Não Assistido"}
                                  </Badge>
                                  {episode.duration > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {episode.duration} min
                                    </div>
                                  )}
                                  {episode.rating > 0 && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                      {episode.rating}/10
                                    </div>
                                  )}
                                  {episode.watched_date && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(
                                        episode.watched_date,
                                      ).toLocaleDateString("pt-PT")}
                                    </div>
                                  )}
                                  {index > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => copyFromPrevious(index)}
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copiar anterior
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Quick Toggles */}
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEpisodeChange(
                                      index,
                                      "is_watched",
                                      !episode.is_watched,
                                    )
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  {episode.is_watched ? (
                                    <Eye className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedEpisodes.includes(index) && (
                              <div className="space-y-4 pt-4 border-t">
                                {/* Custom Fields */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground mb-1">
                                      Duração
                                    </Label>
                                    <div className="flex gap-1">
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
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() =>
                                          applyToAll(
                                            "duration",
                                            episode.duration,
                                          )
                                        }
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground mb-1">
                                      Avaliação
                                    </Label>
                                    <div className="flex gap-1">
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
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() =>
                                          applyToAll("rating", episode.rating)
                                        }
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground mb-1">
                                      Data Lançamento
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
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground mb-1">
                                      Data Visualização
                                    </Label>
                                    <Input
                                      type="date"
                                      value={episode.watched_date || ""}
                                      onChange={(e) =>
                                        handleEpisodeChange(
                                          index,
                                          "watched_date",
                                          e.target.value || "",
                                        )
                                      }
                                      className="h-8 text-sm"
                                      disabled={!episode.is_watched}
                                    />
                                  </div>
                                </div>

                                {/* Three-way toggles */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground mb-2">
                                      Recomendaria?
                                    </Label>
                                    <div className="flex gap-1 p-1 bg-muted/10 rounded-md">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeThreeWayToggle(
                                            index,
                                            "would_recommend",
                                            null,
                                          )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs font-medium ${episode.would_recommend === null ? "bg-emerald-500 text-white" : "bg-background hover:bg-muted"}`}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeThreeWayToggle(
                                            index,
                                            "would_recommend",
                                            false,
                                          )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs font-medium ${episode.would_recommend === false ? "bg-destructive text-destructive-foreground" : "bg-background hover:bg-muted"}`}
                                      >
                                        <X className="h-3 w-3" />
                                        Não
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeThreeWayToggle(
                                            index,
                                            "would_recommend",
                                            true,
                                          )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs font-medium ${episode.would_recommend === true ? "bg-emerald-500 text-white" : "bg-background hover:bg-muted"}`}
                                      >
                                        <Check className="h-3 w-3" />
                                        Sim
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground mb-2">
                                      Reassistiria?
                                    </Label>
                                    <div className="flex gap-1 p-1 bg-muted/10 rounded-md">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeThreeWayToggle(
                                            index,
                                            "would_rewatch",
                                            null,
                                          )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs font-medium ${episode.would_rewatch === null ? "bg-blue-500 text-white" : "bg-background hover:bg-muted"}`}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeThreeWayToggle(
                                            index,
                                            "would_rewatch",
                                            false,
                                          )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs font-medium ${episode.would_rewatch === false ? "bg-destructive text-destructive-foreground" : "bg-background hover:bg-muted"}`}
                                      >
                                        <X className="h-3 w-3" />
                                        Não
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeThreeWayToggle(
                                            index,
                                            "would_rewatch",
                                            true,
                                          )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs font-medium ${episode.would_rewatch === true ? "bg-blue-500 text-white" : "bg-background hover:bg-muted"}`}
                                      >
                                        <Check className="h-3 w-3" />
                                        Sim
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Individual Review */}
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1">
                                    Crítica Individual
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
                                    className="text-sm resize-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-linear-to-r from-primary/5 via-primary/5 to-transparent rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Resumo Final</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Tv className="h-3 w-3" />
                            <span>{seriesName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span>
                              #{calculatedNextNumber} → #
                              {calculatedNextNumber + episodeCount - 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {baseData.is_watched ? (
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-yellow-500" />
                            )}
                            <span>
                              {baseData.is_watched
                                ? "Assistidos"
                                : "Não Assistidos"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {episodeCount} episódios
                        </p>
                        <p className="text-sm text-muted-foreground">
                          prontos para criar
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
