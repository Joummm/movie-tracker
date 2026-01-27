"use client";

import React from "react";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Plus, Check, Trash2, Tv } from "lucide-react";
import type { Series, SeriesEpisodeStructure } from "@/lib/types/database";

interface SeriesStructurePageProps {
  params: Promise<{ id: string }>;
}

export default function SeriesStructurePage({
  params,
}: SeriesStructurePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<SeriesEpisodeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [isAddSeasonOpen, setIsAddSeasonOpen] = useState(false);
  const [isMarkWatchedOpen, setIsMarkWatchedOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] =
    useState<SeriesEpisodeStructure | null>(null);
  const [newSeason, setNewSeason] = useState({
    seasonNumber: "",
    episodeCount: "",
  });
  const [watchedData, setWatchedData] = useState({
    rating: "",
    notes: "",
    watchedDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUserId(user.id);

    const { data: seriesData } = await supabase
      .from("series")
      .select("*")
      .eq("id", id)
      .single();

    if (!seriesData) {
      router.push("/series");
      return;
    }

    setSeries(seriesData);

    const { data: episodesData } = await supabase
      .from("series_episode_structure")
      .select("*")
      .eq("series_id", id)
      .order("season")
      .order("episode");

    setEpisodes(episodesData || []);
    setIsLoading(false);
  }

  async function handleAddSeason(e: React.FormEvent) {
    e.preventDefault();

    const seasonNum = Number.parseInt(newSeason.seasonNumber);
    const epCount = Number.parseInt(newSeason.episodeCount);

    if (seasonNum < 1 || epCount < 1) return;

    const supabase = createClient();

    const episodesToInsert = Array.from({ length: epCount }, (_, i) => ({
      series_id: id,
      season: seasonNum,
      episode: i + 1,
      is_watched: false,
    }));

    await supabase.from("series_episode_structure").insert(episodesToInsert);

    setIsAddSeasonOpen(false);
    setNewSeason({ seasonNumber: "", episodeCount: "" });
    loadData();
  }

  async function handleMarkWatched(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEpisode) return;

    const supabase = createClient();

    // Create content entry for watched episode
    await supabase.from("content").insert({
      user_id: userId,
      type: "episode",
      name: selectedEpisode.name || null,
      series_id: id,
      season: selectedEpisode.season,
      episode: selectedEpisode.episode,
      duration: selectedEpisode.duration,
      rating: watchedData.rating ? Number.parseFloat(watchedData.rating) : null,
      notes: watchedData.notes || null,
      watched_date: watchedData.watchedDate,
      date_precision: "full",
    });

    // Mark as watched in structure
    await supabase
      .from("series_episode_structure")
      .update({ is_watched: true })
      .eq("id", selectedEpisode.id);

    setIsMarkWatchedOpen(false);
    setSelectedEpisode(null);
    setWatchedData({
      rating: "",
      notes: "",
      watchedDate: new Date().toISOString().split("T")[0],
    });
    loadData();
  }

  async function handleDeleteSeason(season: number) {
    if (!confirm(`Tem certeza que deseja apagar a Temporada ${season}?`))
      return;

    const supabase = createClient();
    await supabase
      .from("series_episode_structure")
      .delete()
      .eq("series_id", id)
      .eq("season", season);

    loadData();
  }

  function openMarkWatched(episode: SeriesEpisodeStructure) {
    setSelectedEpisode(episode);
    setWatchedData({
      rating: "",
      notes: "",
      watchedDate: new Date().toISOString().split("T")[0],
    });
    setIsMarkWatchedOpen(true);
  }

  // Group episodes by season
  const seasons = episodes.reduce(
    (acc, ep) => {
      if (!acc[ep.season]) {
        acc[ep.season] = [];
      }
      acc[ep.season].push(ep);
      return acc;
    },
    {} as Record<number, SeriesEpisodeStructure[]>,
  );

  const seasonNumbers = Object.keys(seasons)
    .map(Number)
    .sort((a, b) => a - b);

  if (isLoading || !series) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/series")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às Séries
        </Button>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {series.cover_image ? (
              <img
                src={series.cover_image || "/placeholder.svg"}
                alt={series.name || "Série"}
                className="w-20 h-28 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-28 rounded-lg bg-muted flex items-center justify-center">
                <Tv className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {series.name || "Série sem nome"}
              </h1>
              <p className="text-muted-foreground">Estrutura de Episódios</p>
              <p className="text-sm text-muted-foreground mt-1">
                {episodes.filter((e) => e.is_watched).length} de{" "}
                {episodes.length} episódios vistos
              </p>
            </div>
          </div>
          <Button onClick={() => setIsAddSeasonOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Temporada
          </Button>
        </div>

        {seasonNumbers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Tv className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhuma temporada definida
              </h3>
              <p className="text-muted-foreground mb-4">
                Adicione temporadas para criar a estrutura da série
              </p>
              <Button onClick={() => setIsAddSeasonOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Temporada
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={seasonNumbers.map(String)}
            className="space-y-4"
          >
            {seasonNumbers.map((seasonNum) => {
              const seasonEpisodes = seasons[seasonNum];
              const watchedCount = seasonEpisodes.filter(
                (e) => e.is_watched,
              ).length;

              return (
                <AccordionItem
                  key={seasonNum}
                  value={String(seasonNum)}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-semibold">
                        Temporada {seasonNum}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {watchedCount}/{seasonEpisodes.length} vistos
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSeason(seasonNum);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {seasonEpisodes.map((ep) => (
                        <Card
                          key={ep.id}
                          className={`${ep.is_watched ? "bg-muted/50" : ""}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  Episódio {ep.episode}
                                </p>
                                {ep.name && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {ep.name}
                                  </p>
                                )}
                              </div>
                              {ep.is_watched ? (
                                <div className="flex items-center gap-1 text-green-500">
                                  <Check className="h-4 w-4" />
                                  <span className="text-sm">Visto</span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openMarkWatched(ep)}
                                >
                                  Marcar Visto
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Add Season Dialog */}
        <Dialog open={isAddSeasonOpen} onOpenChange={setIsAddSeasonOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Temporada</DialogTitle>
              <DialogDescription>
                Defina o número da temporada e quantos episódios tem
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSeason} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonNumber">Temporada</Label>
                  <Input
                    id="seasonNumber"
                    type="number"
                    min="1"
                    required
                    value={newSeason.seasonNumber}
                    onChange={(e) =>
                      setNewSeason({
                        ...newSeason,
                        seasonNumber: e.target.value,
                      })
                    }
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episodeCount">Nº de Episódios</Label>
                  <Input
                    id="episodeCount"
                    type="number"
                    min="1"
                    required
                    value={newSeason.episodeCount}
                    onChange={(e) =>
                      setNewSeason({
                        ...newSeason,
                        episodeCount: e.target.value,
                      })
                    }
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSeasonOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Mark Watched Dialog */}
        <Dialog open={isMarkWatchedOpen} onOpenChange={setIsMarkWatchedOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar como Visto</DialogTitle>
              <DialogDescription>
                {selectedEpisode &&
                  `S${selectedEpisode.season}E${selectedEpisode.episode}`}
                {selectedEpisode?.name && ` - ${selectedEpisode.name}`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleMarkWatched} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="watchedDate">Data que assistiu</Label>
                <Input
                  id="watchedDate"
                  type="date"
                  value={watchedData.watchedDate}
                  onChange={(e) =>
                    setWatchedData({
                      ...watchedData,
                      watchedDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação (0-10)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={watchedData.rating}
                  onChange={(e) =>
                    setWatchedData({ ...watchedData, rating: e.target.value })
                  }
                  placeholder="8.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={watchedData.notes}
                  onChange={(e) =>
                    setWatchedData({ ...watchedData, notes: e.target.value })
                  }
                  placeholder="Notas sobre o episódio..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMarkWatchedOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Check className="h-4 w-4 mr-2" />
                  Marcar Visto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
