"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Film,
  Tv,
  Video,
  MoreHorizontal,
  Headphones,
  PlusCircle,
  ChevronLeft,
  Sparkles,
  Star,
  Clock,
  Zap,
} from "lucide-react";
import { MovieForm } from "./movie-form";
import { SeriesForm } from "./series-form";
import { EpisodeForm } from "./episode-form";
import { PodcastForm } from "./podcast-form";
import { PodcastEpisodeForm } from "./podcast-episode-form";
import type { Series } from "@/lib/types/database";

interface ContentTypeSelectorProps {
  userSeries: Series[];
  userId: string;
  userPodcasts?: any[];
}

export function ContentTypeSelector({
  userSeries,
  userId,
  userPodcasts = [],
}: ContentTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [seriesMode, setSeriesMode] = useState<"new" | "existing" | null>(null);
  const [podcastMode, setPodcastMode] = useState<"new" | "existing" | null>(
    null,
  );

  if (
    selectedType === "movie" ||
    selectedType === "short" ||
    selectedType === "other"
  ) {
    return (
      <MovieForm
        type={selectedType}
        userId={userId}
        onBack={() => setSelectedType(null)}
      />
    );
  }

  if (selectedType === "series") {
    if (seriesMode === "new") {
      return <SeriesForm userId={userId} onBack={() => setSeriesMode(null)} />;
    }
    if (seriesMode === "existing") {
      return (
        <EpisodeForm
          userSeries={userSeries}
          userId={userId}
          onBack={() => setSeriesMode(null)}
        />
      );
    }

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
        <Button
          variant="ghost"
          onClick={() => setSelectedType(null)}
          className="mb-6 group cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para seleção
        </Button>
        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Tv className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Série de TV</CardTitle>
            <CardDescription>
              Como você gostaria de adicionar conteúdo de série?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-40 flex flex-col gap-3 p-6 hover:border-primary hover:bg-primary/5 transition-all hover:scale-[1.02] group relative overflow-hidden cursor-pointer"
              onClick={() => setSeriesMode("new")}
            >
              <div className="absolute top-0 right-0 p-2">
                <Sparkles className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg">Nova Série</span>
              <span className="text-sm text-muted-foreground">
                Começar uma série do zero
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-40 flex flex-col gap-3 p-6 hover:border-primary hover:bg-primary/5 transition-all hover:scale-[1.02] group relative overflow-hidden cursor-pointer"
              onClick={() => setSeriesMode("existing")}
              disabled={userSeries.length === 0}
            >
              <div className="absolute top-0 right-0 p-2">
                <Star className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${userSeries.length === 0 ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20"} transition-colors`}
              >
                <Tv
                  className={`h-6 w-6 ${userSeries.length === 0 ? "text-muted-foreground" : "text-primary"}`}
                />
              </div>
              <span className="font-bold text-lg">Série Existente</span>
              <span className="text-sm text-muted-foreground">
                {userSeries.length === 0
                  ? "Crie uma série primeiro"
                  : `${userSeries.length} série${userSeries.length !== 1 ? "s" : ""} disponível${userSeries.length !== 1 ? "s" : ""}`}
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedType === "podcast") {
    if (podcastMode === "new") {
      return (
        <PodcastForm userId={userId} onBack={() => setPodcastMode(null)} />
      );
    }
    if (podcastMode === "existing") {
      return (
        <PodcastEpisodeForm
          userPodcasts={userPodcasts}
          userId={userId}
          onBack={() => setPodcastMode(null)}
        />
      );
    }

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
        <Button
          variant="ghost"
          onClick={() => setSelectedType(null)}
          className="mb-6 group cursor-pointer"
        >
          <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para seleção
        </Button>
        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Podcast</CardTitle>
            <CardDescription>
              Como você gostaria de adicionar conteúdo de podcast?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-40 flex flex-col gap-3 p-6 hover:border-primary hover:bg-primary/5 transition-all hover:scale-[1.02] group relative overflow-hidden cursor-pointer"
              onClick={() => setPodcastMode("new")}
            >
              <div className="absolute top-0 right-0 p-2">
                <Sparkles className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg">Novo Podcast</span>
              <span className="text-sm text-muted-foreground">
                Criar um podcast novo
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-40 flex flex-col gap-3 p-6 hover:border-primary hover:bg-primary/5 transition-all hover:scale-[1.02] group relative overflow-hidden cursor-pointer"
              onClick={() => setPodcastMode("existing")}
              disabled={userPodcasts.length === 0}
            >
              <div className="absolute top-0 right-0 p-2">
                <Star className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${userPodcasts.length === 0 ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20"} transition-colors`}
              >
                <Headphones
                  className={`h-6 w-6 ${userPodcasts.length === 0 ? "text-muted-foreground" : "text-primary"}`}
                />
              </div>
              <span className="font-bold text-lg">Podcast Existente</span>
              <span className="text-sm text-muted-foreground">
                {userPodcasts.length === 0
                  ? "Crie um podcast primeiro"
                  : `${userPodcasts.length} podcast${userPodcasts.length !== 1 ? "s" : ""} disponível${userPodcasts.length !== 1 ? "s" : ""}`}
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tipos de conteúdo com informações detalhadas
  const contentTypes = [
    {
      id: "movie",
      label: "Filme",
      icon: Film,
      description: "Filmes longos ou cinematográficos",
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-500",
      stats: { time: "2h+", type: "Longa-metragem" },
    },
    {
      id: "series",
      label: "Série",
      icon: Tv,
      description: "Séries de TV e temporadas",
      color: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-500",
      stats: { time: "Várias horas", type: "Episódios" },
    },
    {
      id: "podcast",
      label: "Podcast",
      icon: Headphones,
      description: "Episódios de áudio e programas",
      color: "from-green-500/10 to-green-500/5",
      iconColor: "text-green-500",
      stats: { time: "30-60min", type: "Áudio" },
    },
    {
      id: "short",
      label: "Curta",
      icon: Video,
      description: "Curtas-metragens e vídeos",
      color: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-500",
      stats: { time: "< 30min", type: "Curta-duração" },
    },
    {
      id: "other",
      label: "Outro",
      icon: MoreHorizontal,
      description: "Outros tipos de conteúdo",
      color: "from-slate-500/10 to-slate-500/5",
      iconColor: "text-slate-500",
      stats: { time: "Variável", type: "Diversos" },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-primary/5 mb-4">
          <PlusCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Adicionar Conteúdo
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Selecione o tipo de conteúdo que você consumiu para registrar na sua
          coleção
        </p>
      </div>

      <Card className="border-2 shadow-xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Tipos de Conteúdo
            <Sparkles className="h-5 w-5 text-primary" />
          </CardTitle>
          <CardDescription className="text-base">
            Clique em uma categoria para começar
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {contentTypes.map((type) => (
              <Button
                key={type.id}
                variant="outline"
                className={`cursor-pointer h-48 flex flex-col gap-3 p-6 transition-all duration-300 hover:scale-[1.03] group relative overflow-hidden border-2 ${type.color.includes("blue") ? "hover:border-blue-500/30" : ""} ${type.color.includes("purple") ? "hover:border-purple-500/30" : ""} ${type.color.includes("green") ? "hover:border-green-500/30" : ""} ${type.color.includes("amber") ? "hover:border-amber-500/30" : ""} ${type.color.includes("slate") ? "hover:border-slate-500/30" : ""}`}
                onClick={() => setSelectedType(type.id)}
              >
                {/* Efeito de gradiente de fundo */}
                <div
                  className={`absolute inset-0 bg-linear-to-br ${type.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Ícone */}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-background to-muted shadow-sm group-hover:shadow-md transition-shadow">
                  <type.icon className={`h-7 w-7 ${type.iconColor}`} />
                </div>

                {/* Título */}
                <span className="relative z-10 font-bold text-lg group-hover:text-primary transition-colors">
                  {type.label}
                </span>

                {/* Descrição */}
                <span className="relative z-10 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors text-center">
                  {type.description}
                </span>

                {/* Estatísticas */}
                <div className="relative z-10 flex items-center justify-center gap-3 mt-1 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {type.stats.time}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    {type.stats.type}
                  </div>
                </div>

                {/* Indicador de seleção */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary/50 transition-colors" />
              </Button>
            ))}
          </div>

          {/* Ajuda/Info */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Dica: Você pode adicionar múltiplos conteúdos de uma vez usando a
              importação em massa
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
