"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PodcastStatus } from "@/lib/types/database"

interface PodcastFormProps {
  userId: string
  onBack: () => void
}

export function PodcastForm({ userId, onBack }: PodcastFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"podcast" | "episode">("podcast")
  const [podcastId, setPodcastId] = useState<string>("")
  const [podcastData, setPodcastData] = useState({
    name: "",
    coverImage: "",
    releaseYear: "",
    status: "in_progress" as PodcastStatus,
    description: "",
    host: "",
  })

  const handlePodcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("podcasts")
      .insert({
        user_id: userId,
        name: podcastData.name,
        cover_image: podcastData.coverImage || null,
        release_year: podcastData.releaseYear ? Number.parseInt(podcastData.releaseYear) : null,
        status: podcastData.status,
        description: podcastData.description || null,
        host: podcastData.host || null,
      })
      .select()
      .single()

    if (error) {
      alert("Erro ao criar podcast: " + error.message)
      setIsLoading(false)
    } else {
      setPodcastId(data.id)
      setStep("episode")
      setIsLoading(false)
    }
  }

  const handleEpisodeSubmit = async () => {
    // Redirecionar para adicionar episódio
    router.push(`/podcasts/${podcastId}/add-episode`)
  }

  if (step === "episode") {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setStep("podcast")} className="mb-4">
          ← Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Podcast Criado com Sucesso!</CardTitle>
            <CardDescription>Podcast: {podcastData.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>O podcast foi criado com sucesso. Agora pode adicionar o primeiro episódio.</p>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/content")}>
                Ver Conteúdos
              </Button>
              <Button type="button" variant="default" onClick={handleEpisodeSubmit}>
                Adicionar Primeiro Episódio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Podcast</CardTitle>
          <CardDescription>Preencha as informações do podcast</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePodcastSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="podcastName">Nome do Podcast *</Label>
              <Input
                id="podcastName"
                required
                value={podcastData.name}
                onChange={(e) => setPodcastData({ ...podcastData, name: e.target.value })}
                placeholder="Nome do podcast"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="podcastCover">URL da Imagem de Capa</Label>
              <Input
                id="podcastCover"
                value={podcastData.coverImage}
                onChange={(e) => setPodcastData({ ...podcastData, coverImage: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseYear">Ano de Lançamento</Label>
              <Input
                id="releaseYear"
                type="number"
                min="2000"
                max={new Date().getFullYear() + 5}
                value={podcastData.releaseYear}
                onChange={(e) => setPodcastData({ ...podcastData, releaseYear: e.target.value })}
                placeholder="2020"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="host">Host/Apresentador</Label>
              <Input
                id="host"
                value={podcastData.host}
                onChange={(e) => setPodcastData({ ...podcastData, host: e.target.value })}
                placeholder="Nome do host ou apresentador"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status do Podcast</Label>
              <Select
                value={podcastData.status}
                onValueChange={(value) => setPodcastData({ ...podcastData, status: value as PodcastStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">A Ouvir</SelectItem>
                  <SelectItem value="completed">Completo</SelectItem>
                  <SelectItem value="abandoned">Abandonado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={podcastData.description}
                onChange={(e) => setPodcastData({ ...podcastData, description: e.target.value })}
                placeholder="Descrição do podcast..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Podcast"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}