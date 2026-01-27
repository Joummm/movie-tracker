"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Podcast } from "@/lib/types/database"

interface PodcastEpisodeFormProps {
  userPodcasts: Podcast[]
  userId: string
  onBack: () => void
}

export function PodcastEpisodeForm({ userPodcasts, userId, onBack }: PodcastEpisodeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    podcastId: "",
    name: "",
    episodeNumber: "",
    season: "1",
    coverImage: "",
    rating: "",
    duration: "",
    watchedDate: new Date().toISOString().split("T")[0],
    notes: "",
    review: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const { error } = await supabase
      .from("podcast_episodes")
      .insert({
        user_id: userId,
        podcast_id: formData.podcastId,
        name: formData.name,
        episode_number: formData.episodeNumber ? Number.parseInt(formData.episodeNumber) : null,
        season: Number.parseInt(formData.season),
        cover_image: formData.coverImage || null,
        rating: formData.rating ? Number.parseFloat(formData.rating) : null,
        duration: formData.duration ? Number.parseInt(formData.duration) : null,
        watched_date: formData.watchedDate,
        notes: formData.notes || null,
        review: formData.review || null,
      })

    if (error) {
      alert("Erro ao criar episódio: " + error.message)
      setIsLoading(false)
    } else {
      router.push("/podcasts")
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Novo Episódio de Podcast</CardTitle>
          <CardDescription>Adicione um episódio de podcast</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="podcast">Podcast *</Label>
              <Select
                required
                value={formData.podcastId}
                onValueChange={(value) => setFormData({ ...formData, podcastId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um podcast" />
                </SelectTrigger>
                <SelectContent>
                  {userPodcasts.map((podcast) => (
                    <SelectItem key={podcast.id} value={podcast.id}>
                      {podcast.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Episódio *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do episódio"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="season">Temporada</Label>
                <Input
                  id="season"
                  type="number"
                  min="1"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="episodeNumber">Número do Episódio</Label>
                <Input
                  id="episodeNumber"
                  type="number"
                  min="1"
                  value={formData.episodeNumber}
                  onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">URL da Imagem</Label>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação (0-10)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="8.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="watchedDate">Data que ouviu *</Label>
                <Input
                  id="watchedDate"
                  type="date"
                  required
                  value={formData.watchedDate}
                  onChange={(e) => setFormData({ ...formData, watchedDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas sobre o episódio..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review">Review</Label>
              <Textarea
                id="review"
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                placeholder="Review completa do episódio..."
                rows={5}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Episódio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}