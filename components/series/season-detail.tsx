// components/series/season-detail.tsx (parte atualizada - interfaces)
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Star,
  Tv,
  Eye,
  Film,
  List,
  BarChart3,
  Edit,
  Plus,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EpisodesList } from "./episodes-list";

// Interface simplificada para episódio
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
}

// Interface simplificada para temporada
interface Season {
  id: string;
  season_number: number;
  name?: string;
  episode_count: number;
  watched_episode_count: number;
  is_special: boolean;
  poster_vertical?: string;
  poster_horizontal?: string;
  release_year?: number;
  average_rating?: number;
  total_watch_time: number;
  special_type?: string;
  description?: string;
  series?: {
    id: string;
    name?: string;
    cover_image?: string;
  };
}

interface SeasonDetailProps {
  season: Season;
  seriesId: string;
  episodes: Episode[];
  userId: string;
}


export function SeasonDetail({ season, seriesId, episodes, userId }: SeasonDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const progress = season.episode_count > 0 
    ? Math.round((season.watched_episode_count / season.episode_count) * 100) 
    : 0;
  
  const isComplete = progress === 100;
  
  const getDurationText = (minutes: number) => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  // Calculate episode statistics
  const watchedEpisodes = episodes.filter(ep => ep.is_watched).length;
  const averageEpisodeRating = episodes.length > 0
    ? episodes.reduce((sum, ep) => sum + (ep.rating || 0), 0) / episodes.length
    : 0;
  
  const totalEpisodeDuration = episodes.reduce((sum, ep) => sum + (ep.duration || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Image */}
      <div className="relative rounded-lg overflow-hidden">
        {season.poster_horizontal ? (
          <div className="h-48 md:h-64 w-full relative">
            <Image
              src={season.poster_horizontal}
              alt={season.name || `Temporada ${season.season_number}`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        ) : (
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary/20 to-secondary/20" />
        )}
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Season Poster */}
            <div className="hidden md:block">
              <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-xl border-2 border-background">
                {season.poster_vertical ? (
                  <Image
                    src={season.poster_vertical}
                    alt={season.name || `Temporada ${season.season_number}`}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <Tv className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Season Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={season.is_special ? "secondary" : "default"}>
                  {season.is_special ? "Especial" : `Temporada ${season.season_number}`}
                </Badge>
                {isComplete && (
                  <Badge variant="default">
                    <Eye className="h-3 w-3 mr-1" />
                    Completa
                  </Badge>
                )}
                {season.special_type && (
                  <Badge variant="outline">
                    {season.special_type}
                  </Badge>
                )}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold">
                {season.is_special ? "Especial" : `Temporada ${season.season_number}`}
                {season.name && `: ${season.name}`}
              </h2>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tv className="h-4 w-4" />
                  {season.episode_count} episódios
                </span>
                {season.release_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {season.release_year}
                  </span>
                )}
                {season.average_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    {season.average_rating.toFixed(1)}
                  </span>
                )}
                {season.total_watch_time > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getDurationText(season.total_watch_time)}
                  </span>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" asChild>
                  <Link href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Episódio
                  </Link>
                </Button>
                
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/series/${seriesId}/seasons/${season.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/series/${seriesId}/seasons/${season.id}/episodes`}>
                        Ver Todos Episódios
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/series/${seriesId}/seasons/${season.id}/mark-watched`}>
                        Marcar como Assistida
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Excluir Temporada
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="episodes" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Episódios
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {season.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Descrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {season.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>
                          {season.watched_episode_count} de {season.episode_count} episódios assistidos
                        </span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Episódios Assistidos</p>
                        <p className="font-semibold">{watchedEpisodes}/{episodes.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duração Total</p>
                        <p className="font-semibold">{getDurationText(totalEpisodeDuration)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Avaliação Média</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <span className="text-2xl font-bold">
                          {averageEpisodeRating > 0 ? averageEpisodeRating.toFixed(1) : "-"}
                        </span>
                        <span className="text-muted-foreground">/10</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Duração Média</p>
                      <p className="text-2xl font-bold">
                        {episodes.length > 0 ? Math.round(totalEpisodeDuration / episodes.length) : 0} min
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Ano de Lançamento</p>
                      <p className="text-2xl font-bold">
                        {season.release_year || "-"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" asChild>
                      <Link href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Episódio
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/series/${seriesId}/seasons/${season.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Temporada
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/series/${seriesId}/seasons/${season.id}/episodes`}>
                        <List className="h-4 w-4 mr-2" />
                        Ver Todos Episódios
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Episodes Tab */}
          <TabsContent value="episodes" className="m-0">
            <EpisodesList 
              episodes={episodes}
              season={season}
              seriesId={seriesId}
            />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total de Episódios</p>
                    <p className="text-3xl font-bold">{season.episode_count}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Assistidos</p>
                    <p className="text-3xl font-bold">{season.watched_episode_count}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Progresso</p>
                    <p className="text-3xl font-bold">{progress}%</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Duração Total</p>
                    <p className="text-3xl font-bold">{getDurationText(season.total_watch_time)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Avaliação Média</p>
                    <p className="text-3xl font-bold">
                      {season.average_rating ? season.average_rating.toFixed(1) : "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Duração Média</p>
                    <p className="text-3xl font-bold">
                      {season.episode_count > 0 ? Math.round(season.total_watch_time / season.episode_count) : 0} min
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ano</p>
                    <p className="text-3xl font-bold">{season.release_year || "-"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="text-3xl font-bold">
                      {season.is_special ? "Especial" : "Regular"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}