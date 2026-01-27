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
import type { SeriesStatus } from "@/lib/types/database";

interface SeriesFormProps {
  userId: string;
  onBack: () => void;
}

export function SeriesForm({ userId, onBack }: SeriesFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"series" | "episode">("series");
  const [seriesId, setSeriesId] = useState<string>("");
  const [unknownDate, setUnknownDate] = useState(false);
  const [seriesData, setSeriesData] = useState({
    name: "",
    coverImage: "",
    releaseYear: "",
    status: "in_progress" as SeriesStatus,
  });
  const [episodeData, setEpisodeData] = useState({
    name: "",
    season: "1",
    episode: "1",
    rating: "",
    duration: "",
    watchedDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("series")
      .insert({
        user_id: userId,
        name: seriesData.name,
        cover_image: seriesData.coverImage || null,
        release_year: seriesData.releaseYear
          ? Number.parseInt(seriesData.releaseYear)
          : null,
        status: seriesData.status,
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao criar série: " + error.message);
      setIsLoading(false);
    } else {
      setSeriesId(data.id);
      setStep("episode");
      setIsLoading(false);
    }
  };

  const handleEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("content").insert({
      user_id: userId,
      type: "episode",
      name: episodeData.name || null,
      series_id: seriesId,
      season: Number.parseInt(episodeData.season),
      episode: Number.parseInt(episodeData.episode),
      rating: episodeData.rating ? Number.parseFloat(episodeData.rating) : null,
      duration: episodeData.duration
        ? Number.parseInt(episodeData.duration)
        : null,
      watched_date: unknownDate ? null : episodeData.watchedDate,
      notes: episodeData.notes || null,
    });

    if (error) {
      alert("Erro ao adicionar episódio: " + error.message);
      setIsLoading(false);
    } else {
      router.push("/content");
      router.refresh();
    }
  };

  if (step === "episode") {
    return (
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setStep("series")}
          className="mb-4"
        >
          ← Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Primeiro Episódio</CardTitle>
            <CardDescription>Série: {seriesData.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEpisodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="episodeName">Nome do Episódio</Label>
                <Input
                  id="episodeName"
                  value={episodeData.name}
                  onChange={(e) =>
                    setEpisodeData({ ...episodeData, name: e.target.value })
                  }
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
                    value={episodeData.season}
                    onChange={(e) =>
                      setEpisodeData({ ...episodeData, season: e.target.value })
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
                    value={episodeData.episode}
                    onChange={(e) =>
                      setEpisodeData({
                        ...episodeData,
                        episode: e.target.value,
                      })
                    }
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
                    value={episodeData.rating}
                    onChange={(e) =>
                      setEpisodeData({ ...episodeData, rating: e.target.value })
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
                    value={episodeData.duration}
                    onChange={(e) =>
                      setEpisodeData({
                        ...episodeData,
                        duration: e.target.value,
                      })
                    }
                    placeholder="45"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="watchedDate">Data que assistiu</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="unknownDateSeries"
                    checked={unknownDate}
                    onCheckedChange={(checked) =>
                      setUnknownDate(checked === true)
                    }
                  />
                  <Label
                    htmlFor="unknownDateSeries"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Data desconhecida
                  </Label>
                </div>
                {!unknownDate && (
                  <Input
                    id="watchedDate"
                    type="date"
                    required
                    value={episodeData.watchedDate}
                    onChange={(e) =>
                      setEpisodeData({
                        ...episodeData,
                        watchedDate: e.target.value,
                      })
                    }
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={episodeData.notes}
                  onChange={(e) =>
                    setEpisodeData({ ...episodeData, notes: e.target.value })
                  }
                  placeholder="Adicione suas notas sobre o episódio..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onBack}>
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

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Série</CardTitle>
          <CardDescription>Primeiro, vamos criar a série</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSeriesSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seriesName">Nome da Série *</Label>
              <Input
                id="seriesName"
                required
                value={seriesData.name}
                onChange={(e) =>
                  setSeriesData({ ...seriesData, name: e.target.value })
                }
                placeholder="Nome da série"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seriesCover">URL da Imagem de Capa</Label>
              <Input
                id="seriesCover"
                value={seriesData.coverImage}
                onChange={(e) =>
                  setSeriesData({ ...seriesData, coverImage: e.target.value })
                }
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Esta imagem será usada para todos os episódios da série
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseYear">Ano de Lançamento</Label>
              <Input
                id="releaseYear"
                type="number"
                min="1800"
                max={new Date().getFullYear() + 5}
                value={seriesData.releaseYear}
                onChange={(e) =>
                  setSeriesData({ ...seriesData, releaseYear: e.target.value })
                }
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status da Série</Label>
              <Select
                value={seriesData.status}
                onValueChange={(value) =>
                  setSeriesData({
                    ...seriesData,
                    status: value as SeriesStatus,
                  })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">A Ver</SelectItem>
                  <SelectItem value="completed">Completa</SelectItem>
                  <SelectItem value="abandoned">Abandonada</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Séries completas não aparecerão ao adicionar novos episódios
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Próximo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
