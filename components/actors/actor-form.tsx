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

interface ActorFormProps {
  actor?: any
  userId: string
  isEdit?: boolean
}

export function ActorForm({ actor, userId, isEdit = false }: ActorFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: actor?.name || "",
    photo_url: actor?.photo_url || "",
    birth_date: actor?.birth_date || "",
    death_date: actor?.death_date || "",
    nationality: actor?.nationality || "",
    gender: actor?.gender || "other",
    biography: actor?.biography || "",
    tmdb_id: actor?.tmdb_id || "",
    imdb_id: actor?.imdb_id || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    
    // Criar objeto com todos os campos que podem existir
    const actorData: Record<string, any> = {
      user_id: userId,
      name: formData.name || null,
    }

    // Campos opcionais - incluir apenas se tiverem valor
    if (formData.photo_url) actorData.photo_url = formData.photo_url
    if (formData.birth_date) actorData.birth_date = formData.birth_date
    if (formData.death_date) actorData.death_date = formData.death_date
    if (formData.nationality) actorData.nationality = formData.nationality
    if (formData.gender) actorData.gender = formData.gender
    if (formData.biography) actorData.biography = formData.biography
    if (formData.tmdb_id) actorData.tmdb_id = formData.tmdb_id
    if (formData.imdb_id) actorData.imdb_id = formData.imdb_id

    try {
      if (isEdit && actor) {
        const { error } = await supabase
          .from("actors")
          .update(actorData)
          .eq("id", actor.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("actors")
          .insert(actorData)

        if (error) throw error
      }

      router.push("/actors")
      router.refresh()
    } catch (error: any) {
      console.error("Erro detalhado:", error)
      alert("Erro ao salvar ator: " + error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar Ator" : "Novo Ator"}</CardTitle>
          <CardDescription>
            {isEdit ? "Atualize as informações do ator" : "Preencha as informações do ator"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do ator"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo_url">URL da Foto</Label>
              <Input
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="death_date">Data de Morte</Label>
                <Input
                  id="death_date"
                  type="date"
                  value={formData.death_date}
                  onChange={(e) => setFormData({ ...formData, death_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="ex: Portuguesa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="non_binary">Não-binário</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tmdb_id">ID TMDb</Label>
                <Input
                  id="tmdb_id"
                  value={formData.tmdb_id}
                  onChange={(e) => setFormData({ ...formData, tmdb_id: e.target.value })}
                  placeholder="12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imdb_id">ID IMDb</Label>
                <Input
                  id="imdb_id"
                  value={formData.imdb_id}
                  onChange={(e) => setFormData({ ...formData, imdb_id: e.target.value })}
                  placeholder="nm1234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="biography">Biografia</Label>
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                placeholder="Biografia do ator..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEdit ? "Atualizar" : "Criar Ator"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}