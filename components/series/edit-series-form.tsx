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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Series, SeriesStatus } from "@/lib/types/database";

interface EditSeriesFormProps {
  series: Series;
}

export function EditSeriesForm({ series }: EditSeriesFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: series.name,
    release_year: series.release_year?.toString() || "",
    cover_image: series.cover_image || "",
    status: series.status || "in_progress",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("series")
      .update({
        name: formData.name,
        release_year: formData.release_year
          ? Number.parseInt(formData.release_year)
          : null,
        cover_image: formData.cover_image || null,
        status: formData.status,
      })
      .eq("id", series.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar série",
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Sucesso",
        description: "Série atualizada com sucesso",
      });
      router.push("/series");
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Série</CardTitle>
        <CardDescription>Atualize as informações da série</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Série *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="release_year">Ano de Lançamento</Label>
            <Input
              id="release_year"
              type="number"
              min="1900"
              max="2100"
              value={formData.release_year}
              onChange={(e) =>
                setFormData({ ...formData, release_year: e.target.value })
              }
              placeholder="Ex: 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image">URL da Imagem de Capa</Label>
            <Input
              id="cover_image"
              type="url"
              value={formData.cover_image}
              onChange={(e) =>
                setFormData({ ...formData, cover_image: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status da Série</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as SeriesStatus })
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
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "A guardar..." : "Guardar Alterações"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/series")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
