// components/series/episode-detail.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Star,
  Eye,
  EyeOff,
  ThumbsUp,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Edit,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { RatingInput } from "./rating-input";

interface Episode {
  id: string;
  episode_number: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  rating?: number;
  review?: string;
  release_date?: string;
  created_at: string;
  updated_at: string;
  would_recommend?: boolean;
  would_rewatch?: boolean;
  rewatch_count?: number;
  last_rewatch_date?: string;
  notes?: string;
  content_id?: string;
}

interface EpisodeDetailProps {
  episode: Episode;
  seriesId: string;
  seasonId: string;
  seasonNumber: number;
  seasonName?: string;
  isSpecialSeason: boolean;
  seriesName: string;
  nextEpisode?: {
    id: string;
    episode_number: number;
    name?: string;
  };
  previousEpisode?: {
    id: string;
    episode_number: number;
    name?: string;
  };
  userId: string;
}

export function EpisodeDetail({
  episode,
  seriesId,
  seasonId,
  seasonNumber,
  seasonName,
  isSpecialSeason,
  seriesName,
  nextEpisode,
  previousEpisode,
  userId,
}: EpisodeDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isWatched, setIsWatched] = useState(episode.is_watched);
  const [rating, setRating] = useState(episode.rating || 0);
  const [review, setReview] = useState(episode.review || "");
  const [notes, setNotes] = useState(episode.notes || "");
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString("pt-PT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDurationText = (minutes?: number) => {
    if (!minutes) return "Desconhecida";
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

  const handleMarkWatched = async () => {
    setIsLoading(true);
    try {
      // Implemente a lógica para marcar como assistido
      setIsWatched(!isWatched);
      // Aqui você faria a chamada à API para atualizar no banco
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReview = async () => {
    setIsLoading(true);
    try {
      // Implemente a lógica para salvar a avaliação
      // Aqui você faria a chamada à API para atualizar no banco
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Episode Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl">
                  {episode.name || `Episódio ${episode.episode_number}`}
                </span>
                <Badge variant={isWatched ? "default" : "secondary"}>
                  {isWatched ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Assistido
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Não Assistido
                    </>
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="text-xl font-semibold">
                    #{episode.episode_number}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xl font-semibold">
                      {getDurationText(episode.duration)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Data de Lançamento
                  </p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xl font-semibold">
                      {formatDate(episode.release_date)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avaliação</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <p className="text-xl font-semibold">
                      {rating > 0 ? rating.toFixed(1) : "Sem avaliação"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleMarkWatched}
                  disabled={isLoading}
                  variant={isWatched ? "outline" : "default"}
                  className="gap-2"
                >
                  {isWatched ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Marcar como Não Assistido
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Marcar como Assistido
                    </>
                  )}
                </Button>

                <Button variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Adicionar Visualização
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}/edit`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Episódio
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Marcar como Reassistido
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Excluir Episódio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Navigation & Stats */}
        <div className="space-y-6">
          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Navegação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {previousEpisode ? (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    href={`/series/${seriesId}/seasons/${seasonId}/episodes/${previousEpisode.id}`}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">Anterior</p>
                      <p className="font-medium">
                        {previousEpisode.name ||
                          `Episódio ${previousEpisode.episode_number}`}
                      </p>
                    </div>
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start opacity-50"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Anterior</p>
                    <p className="font-medium">Primeiro episódio</p>
                  </div>
                </Button>
              )}

              {nextEpisode ? (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    href={`/series/${seriesId}/seasons/${seasonId}/episodes/${nextEpisode.id}`}
                  >
                    <div className="text-left flex-1">
                      <p className="text-sm text-muted-foreground">Próximo</p>
                      <p className="font-medium">
                        {nextEpisode.name ||
                          `Episódio ${nextEpisode.episode_number}`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start opacity-50"
                  disabled
                >
                  <div className="text-left flex-1">
                    <p className="text-sm text-muted-foreground">Próximo</p>
                    <p className="font-medium">Último episódio</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              <Button variant="ghost" className="w-full" asChild>
                <Link href={`/series/${seriesId}/seasons/${seasonId}/episodes`}>
                  Ver Todos os Episódios
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Reassistido</p>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <p className="text-xl font-semibold">
                    {episode.rewatch_count || 0} vezes
                  </p>
                </div>
                {episode.last_rewatch_date && (
                  <p className="text-xs text-muted-foreground">
                    Última vez: {formatDate(episode.last_rewatch_date)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Recomendação</p>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  <p className="text-xl font-semibold">
                    {episode.would_recommend === true
                      ? "Sim"
                      : episode.would_recommend === false
                        ? "Não"
                        : "Não definido"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Reassistiria</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <p className="text-xl font-semibold">
                    {episode.would_rewatch === true
                      ? "Sim"
                      : episode.would_rewatch === false
                        ? "Não"
                        : "Não definido"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Avaliação
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notas
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Episódio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">
                        Informações Técnicas
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Série</span>
                          <span className="font-medium">{seriesName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Temporada
                          </span>
                          <span className="font-medium">
                            {isSpecialSeason
                              ? "Especial"
                              : `Temporada ${seasonNumber}`}
                            {seasonName && `: ${seasonName}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Episódio
                          </span>
                          <span className="font-medium">
                            #{episode.episode_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duração</span>
                          <span className="font-medium">
                            {getDurationText(episode.duration)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Data de Lançamento
                          </span>
                          <span className="font-medium">
                            {formatDate(episode.release_date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Criado em
                          </span>
                          <span className="font-medium">
                            {formatDate(episode.created_at)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Última atualização
                          </span>
                          <span className="font-medium">
                            {formatDate(episode.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Status</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Assistido
                          </span>
                          <Badge variant={isWatched ? "default" : "secondary"}>
                            {isWatched ? "Sim" : "Não"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Reassistido
                          </span>
                          <span className="font-medium">
                            {episode.rewatch_count || 0} vezes
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Recomendaria
                          </span>
                          <span className="font-medium">
                            {episode.would_recommend === true
                              ? "Sim"
                              : episode.would_recommend === false
                                ? "Não"
                                : "Não definido"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Reassistiria
                          </span>
                          <span className="font-medium">
                            {episode.would_rewatch === true
                              ? "Sim"
                              : episode.would_rewatch === false
                                ? "Não"
                                : "Não definido"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Avaliação</span>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-2xl font-bold">
                      {rating > 0 ? rating.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-muted-foreground">/10</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Sua Avaliação</h3>
                  <RatingInput
                    value={rating}
                    onChange={setRating}
                    max={10}
                    step={0.5}
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Crítica / Comentários</h3>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Escreva sua crítica ou comentários sobre este episódio..."
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Sua crítica será salva automaticamente.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveReview} disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar Avaliação"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Notas Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione notas pessoais sobre este episódio. Pode ser sobre a trama, personagens, momentos marcantes, etc."
                  rows={12}
                  className="resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNotes("")}>
                    Limpar
                  </Button>
                  <Button onClick={handleSaveReview} disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar Notas"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
