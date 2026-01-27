"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActorsForm } from "./actors-form";
import type {
  Series,
  Podcast,
  Actor,
  ContentWithSeries,
} from "@/lib/types/database";

interface EditContentFormProps {
  content: ContentWithSeries & {
    content_actors?: Array<{
      id: string;
      actor_id: string;
      actor?: Actor;
      role_name?: string;
      created_at: string;
    }>;
    podcast_id?: string;
  };
  userSeries: Series[];
  userPodcasts?: Podcast[];
}

export function EditContentForm({
  content,
  userSeries,
  userPodcasts = [],
}: EditContentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [actors, setActors] = useState<Actor[]>([]);
  const [formData, setFormData] = useState({
    name: content.name || "",
    coverImage: content.cover_image || "",
    rating: content.rating?.toString() || "",
    duration: content.duration?.toString() || "",
    watchedDate: content.watched_date,
    notes: content.notes || "",
    review: content.review || "",
    seriesId: content.series_id || "",
    podcastId: content.podcast_id || "",
    season: content.season?.toString() || "",
    episode: content.episode?.toString() || "",
    releaseYear: content.release_year?.toString() || "",
  });

  useEffect(() => {
    loadActors();
  }, []);

  const loadActors = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("actors").select("*").order("name");

    if (data) {
      setActors(data);
    }
  };

  const getTypeLabel = () => {
    switch (content.type) {
      case "movie":
        return "Filme";
      case "episode":
        return "Episódio";
      case "podcast_episode":
        return "Episódio de Podcast";
      case "short":
        return "Short";
      default:
        return "Conteúdo";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    const updateData: any = {
      name: formData.name || null,
      cover_image: formData.coverImage || null,
      rating: formData.rating ? Number.parseFloat(formData.rating) : null,
      duration: formData.duration ? Number.parseInt(formData.duration) : null,
      watched_date: formData.watchedDate,
      notes: formData.notes || null,
      review: formData.review || null,
      release_year: formData.releaseYear
        ? Number.parseInt(formData.releaseYear)
        : null,
    };

    // Add episode-specific fields
    if (content.type === "episode") {
      updateData.series_id = formData.seriesId || null;
      updateData.season = formData.season
        ? Number.parseInt(formData.season)
        : null;
      updateData.episode = formData.episode
        ? Number.parseInt(formData.episode)
        : null;
    }

    // IMPORTANTE: De acordo com o schema, podcast_episode não está na tabela 'content'
    // Está na tabela separada 'podcast_episodes'
    if (content.type === "podcast_episode") {
      // Aqui você precisaria decidir como lidar com episódios de podcast
      // Eles não estão na tabela 'content' mas sim em 'podcast_episodes'
      console.warn("Episódios de podcast não estão na tabela content");
      setIsLoading(false);
      return;
    }

    let table = "content";

    const { error } = await supabase
      .from(table)
      .update(updateData)
      .eq("id", content.id);

    if (error) {
      alert("Erro ao atualizar conteúdo: " + error.message);
      setIsLoading(false);
    } else {
      router.push("/content");
      router.refresh();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Editar {getTypeLabel()}</CardTitle>
          <CardDescription>Atualize as informações do conteúdo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo específico de conteúdo */}
            {content.type === "episode" && (
              <div className="space-y-2">
                <Label htmlFor="series">Série *</Label>
                <Select
                  required
                  value={formData.seriesId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, seriesId: value })
                  }
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

            {content.type === "podcast_episode" && (
              <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
                <p className="text-amber-800">
                  <strong>Atenção:</strong> Episódios de podcast são gerenciados
                  separadamente. Use a seção de podcasts para editar este
                  conteúdo.
                </p>
              </div>
            )}

            {/* Nome do conteúdo */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do conteúdo"
              />
            </div>

            {/* Imagem de capa (não para episódios) */}
            {(content.type === "movie" ||
              content.type === "short" ||
              content.type === "other") && (
              <div className="space-y-2">
                <Label htmlFor="coverImage">URL da Imagem de Capa</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Informações de episódio */}
            {content.type === "episode" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="season">Temporada *</Label>
                  <Input
                    id="season"
                    type="number"
                    min="1"
                    required
                    value={formData.season}
                    onChange={(e) =>
                      setFormData({ ...formData, season: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, episode: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="releaseYear">Ano de Lançamento</Label>
                  <Input
                    id="releaseYear"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear() + 5}
                    value={formData.releaseYear}
                    onChange={(e) =>
                      setFormData({ ...formData, releaseYear: e.target.value })
                    }
                    placeholder="2024"
                  />
                </div>
              </div>
            )}

            {/* Avaliação e duração */}
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
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder={content.type === "episode" ? "45" : "120"}
                />
              </div>
            </div>

            {/* Data assistida */}
            <div className="space-y-2">
              <Label htmlFor="watchedDate">Data que assistiu *</Label>
              <Input
                id="watchedDate"
                type="date"
                required
                value={formData.watchedDate}
                onChange={(e) =>
                  setFormData({ ...formData, watchedDate: e.target.value })
                }
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Adicione suas notas sobre o conteúdo..."
                rows={3}
              />
            </div>

            {/* Review */}
            <div className="space-y-2">
              <Label htmlFor="review">Review</Label>
              <Textarea
                id="review"
                value={formData.review}
                onChange={(e) =>
                  setFormData({ ...formData, review: e.target.value })
                }
                placeholder="Adicione sua review completa..."
                rows={5}
              />
            </div>

            {/* Seção de Atores (apenas para filmes/séries) */}
            {content.type !== "podcast_episode" && (
              <div className="border-t pt-6">
                <ActorsForm
                  contentId={content.id}
                  userId={content.user_id}
                  existingActors={content.content_actors || []}
                />
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || content.type === "podcast_episode"}
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
