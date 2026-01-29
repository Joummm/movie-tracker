// components/series/forms/quick-watch-form.tsx - VERSÃO CORRIGIDA
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  Eye,
  CheckCircle,
  X,
  Calendar,
  Clock,
  Tv,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface QuickWatchFormProps {
  seriesId: string;
  seriesName: string;
  seasons: any[];
  userId: string;
}

export function QuickWatchForm({
  seriesId,
  seriesName,
  seasons,
  userId,
}: QuickWatchFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [watchedDate, setWatchedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(
    new Set(),
  );

  // Prepare episodes data - garantir que todos os dados existem
  const allEpisodes =
    seasons?.flatMap((season: any) =>
      ((season.series_episodes || []) as any[]).map((episode: any) => ({
        ...episode,
        season_id: season.id,
        season_number: season.season_number || 1,
        season_name: season.name,
        is_special: season.is_special || false,
        id: episode.id || `episode-${season.id}-${episode.episode_number}`,
        episode_number: episode.episode_number || 0,
        name: episode.name || `Episódio ${episode.episode_number || 0}`,
        is_watched: episode.is_watched || false,
        rewatch_count: episode.rewatch_count || 0,
        last_rewatch_date: episode.last_rewatch_date || null,
        duration: episode.duration || null,
      })),
    ) || [];

  console.log("All episodes:", allEpisodes);
  console.log("Seasons:", seasons);

  // Filter episodes based on search
  const filteredEpisodes = allEpisodes.filter((episode) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        episode.name?.toLowerCase().includes(query) ||
        `episódio ${episode.episode_number}`.includes(query) ||
        `t${episode.season_number}e${episode.episode_number}`.includes(query)
      );
    }

    if (selectedSeason && episode.season_id !== selectedSeason) {
      return false;
    }

    return true;
  });

  // Group episodes by season
  const episodesBySeason = filteredEpisodes.reduce(
    (acc, episode) => {
      const seasonKey = episode.season_id;
      if (!acc[seasonKey]) {
        acc[seasonKey] = {
          season: seasons.find((s: any) => s.id === episode.season_id),
          episodes: [],
        };
      }
      acc[seasonKey].episodes.push(episode);
      return acc;
    },
    {} as Record<string, any>,
  );

  const handleEpisodeToggle = (episodeId: string) => {
    setSelectedEpisodes((prev) => {
      if (prev.includes(episodeId)) {
        return prev.filter((id) => id !== episodeId);
      } else {
        return [...prev, episodeId];
      }
    });
  };

  const handleSeasonToggle = (seasonId: string) => {
    setExpandedSeasons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seasonId)) {
        newSet.delete(seasonId);
      } else {
        newSet.add(seasonId);
      }
      return newSet;
    });
  };

  const handleSelectAllInSeason = (seasonId: string) => {
    const seasonEpisodes = allEpisodes
      .filter((ep) => ep.season_id === seasonId && !ep.is_watched)
      .map((ep) => ep.id);

    setSelectedEpisodes((prev) => {
      const newSelection = [...prev];
      seasonEpisodes.forEach((epId) => {
        if (!newSelection.includes(epId)) {
          newSelection.push(epId);
        }
      });
      return newSelection;
    });
  };

  const handleDeselectAllInSeason = (seasonId: string) => {
    setSelectedEpisodes((prev) =>
      prev.filter((epId) => {
        const episode = allEpisodes.find((ep) => ep.id === epId);
        return episode?.season_id !== seasonId;
      }),
    );
  };

  const handleSelectAllUnwatched = () => {
    const unwatchedEpisodes = allEpisodes
      .filter((ep) => !ep.is_watched)
      .map((ep) => ep.id);

    setSelectedEpisodes(unwatchedEpisodes);
  };

  const handleClearSelection = () => {
    setSelectedEpisodes([]);
  };

  const handleSubmit = async () => {
    if (selectedEpisodes.length === 0) {
      alert("Selecione pelo menos um episódio para marcar como assistido.");
      return;
    }

    setIsLoading(true);

    try {
      // Para cada episódio selecionado
      for (const episodeId of selectedEpisodes) {
        const episode = allEpisodes.find((ep) => ep.id === episodeId);
        if (!episode) continue;

        console.log("Processing episode:", episode);

        // Verificar se o episódio existe na tabela series_episodes
        let episodeExists = null;
        if (episode.id && !episode.id.startsWith("episode-")) {
          const { data: episodeData } = await supabase
            .from("series_episodes")
            .select("id")
            .eq("id", episode.id)
            .single();

          episodeExists = episodeData;
        }

        let episodeIdForViewing = null;
        if (episodeExists) {
          episodeIdForViewing = episode.id;
        }

        // Encontrar ou criar content_id
        let contentId = null;
        const { data: relatedContent } = await supabase
          .from("content")
          .select("id")
          .eq("series_id", seriesId)
          .eq("season", episode.season_number)
          .eq("episode", episode.episode_number)
          .eq("user_id", userId)
          .single();

        if (relatedContent) {
          contentId = relatedContent.id;
        } else {
          // Criar novo content
          const { data: newContent } = await supabase
            .from("content")
            .insert([
              {
                user_id: userId,
                series_id: seriesId,
                season: episode.season_number,
                episode: episode.episode_number,
                name: episode.name,
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
          console.warn(
            "Could not find or create content for episode:",
            episode,
          );
          continue;
        }

        // Criar visualização
        const viewingData: any = {
          content_id: contentId,
          watched_date: watchedDate,
          watched_year: new Date(watchedDate).getFullYear(),
          watched_month: new Date(watchedDate).getMonth() + 1,
          date_precision: "full",
          date_unknown: false,
          created_at: new Date().toISOString(),
        };

        if (episodeIdForViewing) {
          viewingData.episode_id = episodeIdForViewing;
        }

        console.log("Inserting viewing data:", viewingData);

        await supabase.from("content_viewings").insert([viewingData]);

        // Atualizar episódio (se existir)
        if (episodeExists) {
          const newRewatchCount = (episode.rewatch_count || 0) + 1;

          await supabase
            .from("series_episodes")
            .update({
              is_watched: true,
              rewatch_count: newRewatchCount,
              last_rewatch_date: watchedDate,
              updated_at: new Date().toISOString(),
            })
            .eq("id", episode.id);
        }

        // Atualizar content
        const newRewatchCount = (episode.rewatch_count || 0) + 1;
        await supabase
          .from("content")
          .update({
            watch_status: "completed",
            rewatch_count: newRewatchCount,
            last_rewatch_date: watchedDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", contentId);

        // Atualizar temporada
        const { data: seasonData } = await supabase
          .from("series_seasons")
          .select("watched_episode_count")
          .eq("id", episode.season_id)
          .single();

        if (seasonData && !episode.is_watched) {
          const newWatchedCount = seasonData.watched_episode_count + 1;
          await supabase
            .from("series_seasons")
            .update({
              watched_episode_count: newWatchedCount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", episode.season_id);
        }
      }

      alert(
        `${selectedEpisodes.length} episódio(s) marcado(s) como assistido(s) com sucesso!`,
      );
      router.push(`/series/${seriesId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao marcar episódios:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marcação Rápida de Episódios</h2>
          <p className="text-muted-foreground">
            Marque múltiplos episódios como assistidos de uma vez
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {allEpisodes.filter((ep) => !ep.is_watched).length} episódios não
            assistidos
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Selector */}
            <div className="space-y-2">
              <Label htmlFor="watched_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Visualização
              </Label>
              <Input
                id="watched_date"
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
              />
              <p className="text-xs text-muted-foreground">
                {format(new Date(watchedDate), "dd 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </p>
            </div>

            {/* Season Filter */}
            <div className="space-y-2">
              <Label
                htmlFor="season_filter"
                className="flex items-center gap-2"
              >
                <Tv className="h-4 w-4" />
                Filtrar por Temporada
              </Label>
              <Select
                value={selectedSeason}
                onValueChange={(value) => setSelectedSeason(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as temporadas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as temporadas</SelectItem>
                  {seasons?.map((season: any) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.is_special
                        ? "Especial"
                        : `Temporada ${season.season_number || 1}`}
                      {season.name && `: ${season.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Pesquisar Episódios
              </Label>
              <Input
                id="search"
                placeholder="Nome do episódio ou número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllUnwatched}
              disabled={isLoading}
            >
              Selecionar Todos Não Assistidos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={isLoading}
            >
              Limpar Seleção
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary">
                {selectedEpisodes.length} selecionados
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Episodes List */}
      <Card>
        <CardHeader>
          <CardTitle>Episódios</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(episodesBySeason).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum episódio encontrado</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Tente uma pesquisa diferente"
                  : "Adicione episódios primeiro"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(episodesBySeason).map(
                ([seasonId, seasonData]: [string, any]) => {
                  const isExpanded = expandedSeasons.has(seasonId);
                  const seasonEpisodes = seasonData.episodes || [];
                  const selectedInSeason = selectedEpisodes.filter((epId) =>
                    seasonEpisodes.some((ep: any) => ep.id === epId),
                  ).length;
                  const totalInSeason = seasonEpisodes.length;

                  return (
                    <div
                      key={seasonId}
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Season Header */}
                      <button
                        type="button"
                        onClick={() => handleSeasonToggle(seasonId)}
                        className="w-full p-4 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <div className="text-left">
                            <h3 className="font-semibold">
                              {seasonData.season?.is_special
                                ? "Especial"
                                : `Temporada ${seasonData.season?.season_number || 1}`}
                              {seasonData.season?.name &&
                                `: ${seasonData.season.name}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {seasonEpisodes.length} episódio
                              {seasonEpisodes.length !== 1 ? "s" : ""} •
                              {selectedInSeason > 0 &&
                                ` ${selectedInSeason} selecionado${selectedInSeason !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllInSeason(seasonId);
                            }}
                          >
                            Selecionar Todos
                          </Button>
                          {selectedInSeason > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeselectAllInSeason(seasonId);
                              }}
                            >
                              Desmarcar Todos
                            </Button>
                          )}
                        </div>
                      </button>

                      {/* Season Episodes */}
                      {isExpanded && (
                        <div className="p-4 space-y-2">
                          {seasonEpisodes.map((episode: any) => (
                            <div
                              key={episode.id}
                              className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                                selectedEpisodes.includes(episode.id)
                                  ? "bg-primary/5 border-primary/20"
                                  : "hover:bg-muted/50"
                              } ${episode.is_watched ? "opacity-75" : ""}`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  id={`episode-${episode.id}`}
                                  checked={selectedEpisodes.includes(
                                    episode.id,
                                  )}
                                  onChange={() =>
                                    handleEpisodeToggle(episode.id)
                                  }
                                  disabled={episode.is_watched || isLoading}
                                  className="h-4 w-4 rounded border-gray-300"
                                />

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={`episode-${episode.id}`}
                                      className={`font-medium cursor-pointer ${
                                        episode.is_watched
                                          ? "line-through text-muted-foreground"
                                          : ""
                                      }`}
                                    >
                                      {episode.name}
                                    </Label>

                                    {episode.is_watched && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Assistido
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Tv className="h-3 w-3" />T
                                      {episode.season_number || 1}E
                                      {episode.episode_number || 0}
                                    </span>

                                    {episode.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {Math.floor(
                                          episode.duration / 60,
                                        )}h {episode.duration % 60}min
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                {episode.is_watched &&
                                  episode.last_rewatch_date && (
                                    <span>
                                      Visto em{" "}
                                      {format(
                                        new Date(episode.last_rewatch_date),
                                        "dd/MM/yy",
                                      )}
                                    </span>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary and Submit */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Resumo</h3>
              <p className="text-sm text-muted-foreground">
                {selectedEpisodes.length} episódio
                {selectedEpisodes.length !== 1 ? "s" : ""} selecionado
                {selectedEpisodes.length !== 1 ? "s" : ""} • Data:{" "}
                {format(new Date(watchedDate), "dd/MM/yyyy")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || selectedEpisodes.length === 0}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isLoading
                  ? "Processando..."
                  : `Marcar ${selectedEpisodes.length} Episódio${selectedEpisodes.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
