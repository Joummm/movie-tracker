"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Calendar,
  User,
  Clock,
  Star,
  Edit,
  PlayCircle,
  Headphones,
  List,
  BarChart,
  ArrowLeft,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Podcast, PodcastEpisode } from "@/lib/types/database";

interface PodcastDetailProps {
  podcast: Podcast;
}

export function PodcastDetail({ podcast }: PodcastDetailProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("episodes");

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "A Ouvir";
      case "completed":
        return "Completo";
      case "abandoned":
        return "Abandonado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "abandoned":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDisplayName = () => {
    return podcast.name || "Podcast sem título";
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "Desconhecida";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getEpisodeStats = () => {
    const episodes = podcast.episodes || [];
    const totalEpisodes = episodes.length;
    const listenedEpisodes = episodes.filter((ep) => ep.watched_date).length;
    const totalDuration = episodes.reduce(
      (sum, ep) => sum + (ep.duration || 0),
      0,
    );
    const averageRating =
      episodes.length > 0
        ? episodes.reduce((sum, ep) => sum + (ep.rating || 0), 0) /
          episodes.length
        : 0;

    return {
      totalEpisodes,
      listenedEpisodes,
      totalDuration,
      averageRating,
    };
  };

  const stats = getEpisodeStats();

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Skeleton loading */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-48 h-48 rounded-lg bg-muted animate-pulse mb-4" />
                  <div className="h-8 bg-muted rounded animate-pulse w-3/4 mb-2" />
                  <div className="h-6 bg-muted rounded animate-pulse w-1/4 mb-4" />
                  <div className="space-y-2 w-full">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-4 bg-muted rounded animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <div className="h-10 bg-muted rounded animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Podcast info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-muted mb-4">
                  {podcast.cover_image ? (
                    <Image
                      src={podcast.cover_image}
                      alt={getDisplayName()}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Mic className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{getDisplayName()}</h1>

                <div className="mb-4">
                  <Badge className={`${getStatusColor(podcast.status)}`}>
                    {getStatusLabel(podcast.status)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {podcast.host && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Host: {podcast.host}</span>
                    </div>
                  )}

                  {podcast.release_year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Lançamento: {podcast.release_year}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    <span>
                      {stats.listenedEpisodes}/{stats.totalEpisodes} episódios
                      ouvidos
                    </span>
                  </div>

                  {stats.totalDuration > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Tempo total: {formatDuration(stats.totalDuration)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {podcast.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {podcast.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Button className="w-full" asChild>
            <Link href={`/podcasts/edit/${podcast.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Podcast
            </Link>
          </Button>
        </div>

        {/* Right column - Episodes and stats */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="episodes">
                <List className="h-4 w-4 mr-2" />
                Episódios ({podcast.episodes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart className="h-4 w-4 mr-2" />
                Estatísticas
              </TabsTrigger>
              <TabsTrigger value="quick-add">
                <PlayCircle className="h-4 w-4 mr-2" />
                Ouvir Agora
              </TabsTrigger>
            </TabsList>

            <TabsContent value="episodes" className="space-y-4">
              {podcast.episodes && podcast.episodes.length > 0 ? (
                <div className="space-y-4">
                  {podcast.episodes
                    .sort((a, b) => {
                      // Sort by season and episode number
                      if (a.season !== b.season)
                        return (b.season || 1) - (a.season || 1);
                      return (b.episode_number || 0) - (a.episode_number || 0);
                    })
                    .map((episode) => (
                      <Card key={episode.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-muted-foreground">
                                  S{episode.season || 1}E
                                  {episode.episode_number
                                    ?.toString()
                                    .padStart(2, "0") || "??"}
                                </span>
                                {episode.watched_date && (
                                  <Badge variant="outline" className="text-xs">
                                    Ouvido
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-semibold text-lg mb-2">
                                {episode.name ||
                                  `Episódio ${episode.episode_number}`}
                              </h3>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {episode.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(episode.duration)}
                                  </span>
                                )}

                                {episode.rating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    {episode.rating.toFixed(1)}
                                  </span>
                                )}

                                {episode.watched_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(
                                      episode.watched_date,
                                    ).toLocaleDateString("pt-PT")}
                                  </span>
                                )}
                              </div>

                              {episode.notes && (
                                <p className="text-sm mt-2 line-clamp-2">
                                  {episode.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button size="sm" variant="outline" asChild>
                                <Link
                                  href={`/podcast-episodes/edit/${episode.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              {!episode.watched_date && (
                                <Button size="sm" asChild>
                                  <Link
                                    href={`/podcast-episodes/${episode.id}/listen`}
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">
                      Nenhum episódio adicionado
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Adicione o primeiro episódio que você ouviu
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/podcasts/${podcast.id}/episodes/add`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Episódio
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Podcast</CardTitle>
                  <CardDescription>Resumo das suas audições</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Episódios</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {stats.totalEpisodes}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          total
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stats.listenedEpisodes} ouvidos •{" "}
                        {stats.totalEpisodes - stats.listenedEpisodes} por ouvir
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Tempo de Escuta</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {formatDuration(stats.totalDuration)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tempo total investido
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Avaliação Média</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {stats.averageRating > 0
                            ? stats.averageRating.toFixed(1)
                            : "—"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /10
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Média das suas avaliações
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Progresso</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {stats.totalEpisodes > 0
                            ? Math.round(
                                (stats.listenedEpisodes / stats.totalEpisodes) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${stats.totalEpisodes > 0 ? (stats.listenedEpisodes / stats.totalEpisodes) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick-add">
              <Card>
                <CardHeader>
                  <CardTitle>Ouvir Episódio Agora</CardTitle>
                  <CardDescription>
                    Registe rapidamente um episódio ouvido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Número do Episódio
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2 border rounded"
                        placeholder="ex: 42"
                        defaultValue={
                          podcast.episodes ? podcast.episodes.length + 1 : 1
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Temporada (opcional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2 border rounded"
                        placeholder="ex: 3"
                        defaultValue="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Nome do Episódio (opcional)
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="ex: O episódio especial"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Duração (minutos)
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full p-2 border rounded"
                          placeholder="ex: 45"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Avaliação (0-10)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          className="w-full p-2 border rounded"
                          placeholder="ex: 8.5"
                        />
                      </div>
                    </div>

                    <Button className="w-full" asChild>
                      <Link href={`/podcasts/${podcast.id}/episodes/add`}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Marcar como Ouvido
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
