"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Film, Tv, Video, MoreHorizontal, Headphones } from "lucide-react"
import { MovieForm } from "./movie-form"
import { SeriesForm } from "./series-form"
import { EpisodeForm } from "./episode-form"
import { PodcastForm } from "./podcast-form"
import { PodcastEpisodeForm } from "./podcast-episode-form"
import type { Series } from "@/lib/types/database"

interface ContentTypeSelectorProps {
  userSeries: Series[]
  userId: string
  userPodcasts?: any[]
}

export function ContentTypeSelector({ userSeries, userId, userPodcasts = [] }: ContentTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [seriesMode, setSeriesMode] = useState<"new" | "existing" | null>(null)
  const [podcastMode, setPodcastMode] = useState<"new" | "existing" | null>(null)

  if (selectedType === "movie" || selectedType === "short" || selectedType === "other") {
    return <MovieForm type={selectedType} userId={userId} onBack={() => setSelectedType(null)} />
  }

  if (selectedType === "series") {
    if (seriesMode === "new") {
      return <SeriesForm userId={userId} onBack={() => setSeriesMode(null)} />
    }
    if (seriesMode === "existing") {
      return <EpisodeForm userSeries={userSeries} userId={userId} onBack={() => setSeriesMode(null)} />
    }

    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setSelectedType(null)} className="mb-4">
          ← Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Episódio de Série</CardTitle>
            <CardDescription>
              Escolha se quer criar uma nova série ou adicionar episódio a uma existente
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2 bg-transparent"
              onClick={() => setSeriesMode("new")}
            >
              <Tv className="h-8 w-8" />
              <span className="font-semibold">Nova Série</span>
              <span className="text-xs text-muted-foreground">Criar uma nova série</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2 bg-transparent"
              onClick={() => setSeriesMode("existing")}
              disabled={userSeries.length === 0}
            >
              <Tv className="h-8 w-8" />
              <span className="font-semibold">Série Existente</span>
              <span className="text-xs text-muted-foreground">
                {userSeries.length === 0 ? "Nenhuma série criada" : "Adicionar episódio"}
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedType === "podcast") {
    if (podcastMode === "new") {
      return <PodcastForm userId={userId} onBack={() => setPodcastMode(null)} />
    }
    if (podcastMode === "existing") {
      return <PodcastEpisodeForm 
        userPodcasts={userPodcasts} 
        userId={userId} 
        onBack={() => setPodcastMode(null)} 
      />
    }

    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setSelectedType(null)} className="mb-4">
          ← Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Episódio de Podcast</CardTitle>
            <CardDescription>
              Escolha se quer criar um novo podcast ou adicionar episódio a um existente
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2 bg-transparent"
              onClick={() => setPodcastMode("new")}
            >
              <Headphones className="h-8 w-8" />
              <span className="font-semibold">Novo Podcast</span>
              <span className="text-xs text-muted-foreground">Criar um novo podcast</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2 bg-transparent"
              onClick={() => setPodcastMode("existing")}
              disabled={userPodcasts.length === 0}
            >
              <Headphones className="h-8 w-8" />
              <span className="font-semibold">Podcast Existente</span>
              <span className="text-xs text-muted-foreground">
                {userPodcasts.length === 0 ? "Nenhum podcast criado" : "Adicionar episódio"}
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Adicionar Conteúdo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Escolha o tipo de conteúdo</CardTitle>
          <CardDescription>Selecione o tipo de conteúdo que deseja adicionar</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => setSelectedType("movie")}
          >
            <Film className="h-8 w-8" />
            <span className="font-semibold">Filme</span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => setSelectedType("series")}
          >
            <Tv className="h-8 w-8" />
            <span className="font-semibold">Série</span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => setSelectedType("podcast")}
          >
            <Headphones className="h-8 w-8" />
            <span className="font-semibold">Podcast</span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => setSelectedType("short")}
          >
            <Video className="h-8 w-8" />
            <span className="font-semibold">Short</span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-2 bg-transparent"
            onClick={() => setSelectedType("other")}
          >
            <MoreHorizontal className="h-8 w-8" />
            <span className="font-semibold">Outro</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}