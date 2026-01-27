"use client";

import { Checkbox } from "@/components/ui/checkbox";

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
import type { ContentType, DatePrecision } from "@/lib/types/database";

interface MovieFormProps {
  type: ContentType;
  userId: string;
  onBack: () => void;
}

export function MovieForm({ type, userId, onBack }: MovieFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [datePrecision, setDatePrecision] = useState<DatePrecision>("full");
  const [formData, setFormData] = useState({
    name: "",
    coverImage: "",
    releaseYear: "",
    rating: "",
    duration: "",
    watchedDate: new Date().toISOString().split("T")[0],
    watchedYear: new Date().getFullYear().toString(),
    watchedMonth: (new Date().getMonth() + 1).toString(),
    notes: "",
  });
  const [unknownDate, setUnknownDate] = useState(false);

  const getTypeLabel = () => {
    switch (type) {
      case "movie":
        return "Filme";
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

    // Build date data based on precision
    const dateData: Record<string, unknown> = {
      date_precision: datePrecision,
    };

    if (datePrecision === "full") {
      dateData.watched_date = formData.watchedDate;
    } else if (datePrecision === "month") {
      dateData.watched_year = Number.parseInt(formData.watchedYear);
      dateData.watched_month = Number.parseInt(formData.watchedMonth);
    } else if (datePrecision === "year") {
      dateData.watched_year = Number.parseInt(formData.watchedYear);
    }

    const { error } = await supabase.from("content").insert({
      user_id: userId,
      type,
      name: formData.name || null,
      cover_image: formData.coverImage || null,
      release_year: formData.releaseYear
        ? Number.parseInt(formData.releaseYear)
        : null,
      rating: formData.rating ? Number.parseFloat(formData.rating) : null,
      duration: formData.duration ? Number.parseInt(formData.duration) : null,
      notes: formData.notes || null,
      ...dateData,
    });

    if (error) {
      alert("Erro ao adicionar conteúdo: " + error.message);
      setIsLoading(false);
    } else {
      router.push("/content");
      router.refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar {getTypeLabel()}</CardTitle>
          <CardDescription>Preencha as informações do conteúdo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do conteúdo (opcional)"
              />
            </div>

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
                  placeholder="120"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data que assistiu</Label>
              <Select
                value={datePrecision}
                onValueChange={(v) => setDatePrecision(v as DatePrecision)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Data completa</SelectItem>
                  <SelectItem value="month">Apenas mês e ano</SelectItem>
                  <SelectItem value="year">Apenas ano</SelectItem>
                </SelectContent>
              </Select>

              {datePrecision === "full" && (
                <Input
                  id="watchedDate"
                  type="date"
                  required
                  value={formData.watchedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, watchedDate: e.target.value })
                  }
                />
              )}

              {datePrecision === "month" && (
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.watchedMonth}
                    onValueChange={(v) =>
                      setFormData({ ...formData, watchedMonth: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.watchedYear}
                    onChange={(e) =>
                      setFormData({ ...formData, watchedYear: e.target.value })
                    }
                    placeholder="Ano"
                  />
                </div>
              )}

              {datePrecision === "year" && (
                <Input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.watchedYear}
                  onChange={(e) =>
                    setFormData({ ...formData, watchedYear: e.target.value })
                  }
                  placeholder="Ano"
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
                placeholder="Adicione suas notas sobre o conteúdo..."
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
  );
}
