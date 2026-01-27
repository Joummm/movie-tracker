"use client";

import type React from "react";
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

interface AddPodcastEpisodeProps {
  podcastId: string;
  userId: string;
  onBack?: () => void;
}

export function AddPodcastEpisode({
  podcastId,
  userId,
  onBack,
}: AddPodcastEpisodeProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [unknownDate, setUnknownDate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    episode_number: "1",
    season: "1",
    rating: "",
    duration: "",
    watched_date: new Date().toISOString().split("T")[0],
    notes: "",
    review: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    const episodeData = {
      user_id: userId,
      podcast_id: podcastId,
      name: formData.name || null,
      episode_number: Number.parseInt(formData.episode_number),
      season: Number.parseInt(formData.season),
      rating: formData.rating ? Number.parseFloat(formData.rating) : null,
      duration: formData.duration ? Number.parseInt(formData.duration) : null,
      watched_date: unknownDate ? null : formData.watched_date,
      notes: formData.notes || null,
      review: formData.review || null,
    };

    try {
      const { error } = await supabase
        .from("podcast_episodes")
        .insert(episodeData);

      if (error) throw error;

      if (onBack) {
        onBack();
      } else {
        router.push(`/podcasts/${podcastId}`);
        router.refresh();
      }
    } catch (error: any) {
      alert("Erro ao adicionar episódio: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Voltar
        </Button>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Episódio de Podcast</CardTitle>
          <CardDescription>Registe um episódio que você ouviu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="season">Temporada</Label>
                <Input
                  id="season"
                  type="number"
                  min="1"
                  value={formData.season}
                  onChange={(e) =>
                    setFormData({ ...formData, season: e.target.value })
                  }
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="episode_number">Número do Episódio *</Label>
                <Input
                  id="episode_number"
                  type="number"
                  min="1"
                  required
                  value={formData.episode_number}
                  onChange={(e) =>
                    setFormData({ ...formData, episode_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Episódio</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do episódio (opcional)"
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
                  placeholder="45"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="watched_date">Data que ouviu</Label>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="unknownDatePodcast"
                  checked={unknownDate}
                  onCheckedChange={(checked) =>
                    setUnknownDate(checked === true)
                  }
                />
                <Label
                  htmlFor="unknownDatePodcast"
                  className="text-sm font-normal cursor-pointer"
                >
                  Data desconhecida
                </Label>
              </div>
              {!unknownDate && (
                <Input
                  id="watched_date"
                  type="date"
                  required
                  value={formData.watched_date}
                  onChange={(e) =>
                    setFormData({ ...formData, watched_date: e.target.value })
                  }
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Adicione suas notas sobre o episódio..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review">Crítica (opcional)</Label>
              <Textarea
                id="review"
                value={formData.review}
                onChange={(e) =>
                  setFormData({ ...formData, review: e.target.value })
                }
                placeholder="Escreva sua crítica sobre o episódio..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onBack || (() => router.back())}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adicionando..." : "Adicionar Episódio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
