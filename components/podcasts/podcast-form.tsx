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
import type { Podcast, PodcastStatus } from "@/lib/types/database";

interface PodcastFormProps {
  podcast?: Podcast;
  userId: string;
  isEdit?: boolean;
}

export function PodcastForm({
  podcast,
  userId,
  isEdit = false,
}: PodcastFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: podcast?.name || "",
    cover_image: podcast?.cover_image || "",
    release_year: podcast?.release_year?.toString() || "",
    status: podcast?.status || ("in_progress" as PodcastStatus),
    description: podcast?.description || "",
    host: podcast?.host || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    const podcastData = {
      user_id: userId,
      name: formData.name || null,
      cover_image: formData.cover_image || null,
      release_year: formData.release_year
        ? Number.parseInt(formData.release_year)
        : null,
      status: formData.status,
      description: formData.description || null,
      host: formData.host || null,
    };

    try {
      if (isEdit && podcast) {
        const { error } = await supabase
          .from("podcasts")
          .update(podcastData)
          .eq("id", podcast.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("podcasts").insert(podcastData);

        if (error) throw error;
      }

      router.push("/podcasts");
      router.refresh();
    } catch (error: any) {
      alert("Erro ao salvar podcast: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar Podcast" : "Novo Podcast"}</CardTitle>
          <CardDescription>
            {isEdit
              ? "Atualize as informações do podcast"
              : "Preencha as informações do podcast"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Podcast</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do podcast (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">URL da Imagem de Capa</Label>
              <Input
                id="cover_image"
                value={formData.cover_image}
                onChange={(e) =>
                  setFormData({ ...formData, cover_image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="release_year">Ano de Lançamento</Label>
                <Input
                  id="release_year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  value={formData.release_year}
                  onChange={(e) =>
                    setFormData({ ...formData, release_year: e.target.value })
                  }
                  placeholder="2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="host">Apresentador/Host</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) =>
                    setFormData({ ...formData, host: e.target.value })
                  }
                  placeholder="Nome do apresentador"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as PodcastStatus })
                }
              >
                <SelectTrigger>
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
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do podcast..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Salvando..."
                  : isEdit
                    ? "Atualizar"
                    : "Criar Podcast"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
