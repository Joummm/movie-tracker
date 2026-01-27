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
import { Checkbox } from "@/components/ui/checkbox"
import type { Series } from "@/lib/types/database"

interface EpisodeFormProps {
  userSeries: Series[]
  userId: string
  onBack: () => void
}

export function EpisodeForm({ userSeries, userId, onBack }: EpisodeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [unknownDate, setUnknownDate] = useState(false)
  const [formData, setFormData] = useState({
    seriesId: "",
    name: "",
    season: "1",
    episode: "1",
    rating: "",
    duration: "",
    watchedDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const filteredSeries = userSeries.filter((series) => series.status !== "completed")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from("content").insert({
      user_id: userId,
      type: "episode",
      name: formData.name || null,
      series_id: formData.seriesId,
      season: Number.parseInt(formData.season),
      episode: Number.parseInt(formData.episode),
      rating: formData.rating ? Number.parseFloat(formData.rating) : null,
      duration: formData.duration ? Number.parseInt(formData.duration) : null,
      watched_date: unknownDate ? null : formData.watchedDate,
      notes: formData.notes || null,
    })

    if (error) {
      alert("Erro ao adicionar episódio: " + error.message)
      setIsLoading(false)
    } else {
      router.push("/content")
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
          <CardTitle>Adicionar Episódio</CardTitle>
          <CardDescription>Adicione um episódio a uma série existente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  {filteredSeries.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">Nenhuma série disponível</div>
                  ) : (
                    filteredSeries.map((series) => (
                      <SelectItem key={series.id} value={series.id}>
                        {series.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="episodeName">Nome do Episódio</Label>
              <Input
                id="episodeName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do episódio (opcional)"
              />
            </div>

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
                  placeholder="45"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="watchedDate">Data que assistiu</Label>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="unknownDateEp"
                  checked={unknownDate}
                  onCheckedChange={(checked) => setUnknownDate(checked === true)}
                />
                <Label htmlFor="unknownDateEp" className="text-sm font-normal cursor-pointer">
                  Data desconhecida
                </Label>
              </div>
              {!unknownDate && (
                <Input
                  id="watchedDate"
                  type="date"
                  required
                  value={formData.watchedDate}
                  onChange={(e) => setFormData({ ...formData, watchedDate: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione suas notas sobre o episódio..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
