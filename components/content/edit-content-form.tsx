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
import type { ContentWithSeries, Series } from "@/lib/types/database"

interface EditContentFormProps {
  content: ContentWithSeries
  userSeries: Series[]
}

export function EditContentForm({ content, userSeries }: EditContentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: content.name,
    coverImage: content.cover_image || "",
    rating: content.rating?.toString() || "",
    duration: content.duration?.toString() || "",
    watchedDate: content.watched_date,
    notes: content.notes || "",
    seriesId: content.series_id || "",
    season: content.season?.toString() || "",
    episode: content.episode?.toString() || "",
  })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Filme"
      case "episode":
        return "Episódio"
      case "short":
        return "Short"
      default:
        return "Conteúdo"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const updateData: any = {
      name: formData.name,
      cover_image: formData.coverImage || null,
      rating: formData.rating ? Number.parseFloat(formData.rating) : null,
      duration: formData.duration ? Number.parseInt(formData.duration) : null,
      watched_date: formData.watchedDate,
      notes: formData.notes || null,
    }

    // Add episode-specific fields
    if (content.type === "episode") {
      updateData.series_id = formData.seriesId
      updateData.season = Number.parseInt(formData.season)
      updateData.episode = Number.parseInt(formData.episode)
    }

    const { error } = await supabase.from("content").update(updateData).eq("id", content.id)

    if (error) {
      alert("Erro ao atualizar conteúdo: " + error.message)
      setIsLoading(false)
    } else {
      router.push("/content")
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Editar {getTypeLabel(content.type)}</CardTitle>
          <CardDescription>Atualize as informações do conteúdo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {content.type === "episode" && (
              <div className="space-y-2">
                <Label htmlFor="series">Série *</Label>
                <Select
                  required
                  value={formData.seriesId}
                  onValueChange={(value) => setFormData({ ...formData, seriesId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma série" />
                  </SelectTrigger>
                  <SelectContent>
                    {userSeries.map((series) => (
                      <SelectItem key={series.id} value={series.id}>
                        {series.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do conteúdo"
              />
            </div>

            {content.type !== "episode" && (
              <div className="space-y-2">
                <Label htmlFor="coverImage">URL da Imagem de Capa</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            {content.type === "episode" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="season">Temporada *</Label>
                  <Input
                    id="season"
                    type="number"
                    min="1"
                    required
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="episode">Episódio *</Label>
                  <Input
                    id="episode"
                    type="number"
                    min="1"
                    required
                    value={formData.episode}
                    onChange={(e) => setFormData({ ...formData, episode: e.target.value })}
                  />
                </div>
              </div>
            )}

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
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder={content.type === "episode" ? "45" : "120"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="watchedDate">Data que assistiu *</Label>
              <Input
                id="watchedDate"
                type="date"
                required
                value={formData.watchedDate}
                onChange={(e) => setFormData({ ...formData, watchedDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione suas notas sobre o conteúdo..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
