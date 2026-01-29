// components/series/forms/new-series-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  Film,
  Calendar,
  Tv,
  Star,
  Clock,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  Plus,
  Settings,
  List,
  Save,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NewSeriesFormProps {
  userId: string;
}

export function NewSeriesForm({ userId }: NewSeriesFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: "",
    cover_image: "",
    release_year: "",
    status: "in_progress" as "in_progress" | "abandoned" | "completed",
    total_seasons: 0,
    total_episodes: 0,
    poster_vertical: "",
    poster_horizontal: "",
    would_recommend: false,
    would_rewatch: false,
    average_rating: 0,
    total_watch_time: 0,
    has_special_seasons: false,
    start_date: "",
    end_date: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Por favor, insira um nome para a série.");
      return;
    }

    setIsLoading(true);

    try {
      const seriesData = {
        user_id: userId,
        name: formData.name,
        cover_image: formData.cover_image || null,
        release_year: formData.release_year
          ? parseInt(formData.release_year)
          : null,
        status: formData.status,
        total_seasons: formData.total_seasons || 0,
        total_episodes: formData.total_episodes || 0,
        poster_vertical: formData.poster_vertical || null,
        poster_horizontal: formData.poster_horizontal || null,
        would_recommend: formData.would_recommend || null,
        would_rewatch: formData.would_rewatch || null,
        average_rating: formData.average_rating || null,
        total_watch_time: formData.total_watch_time || 0,
        has_special_seasons: formData.has_special_seasons || false,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const { data: newSeries, error } = await supabase
        .from("series")
        .insert([seriesData])
        .select()
        .single();

      if (error) throw error;

      alert("Série criada com sucesso!");
      router.push(`/series/${newSeries.id}`);
    } catch (error: any) {
      console.error("Erro ao criar série:", error);
      alert(`Erro ao criar série: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Série</h1>
            <p className="text-muted-foreground">
              Adicione uma nova série à sua coleção
            </p>
          </div>
        </div>

        {/* Botão de criar no topo também */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="submit"
            form="series-form"
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "Criando..." : "Criar Série"}
          </Button>
        </div>
      </div>

      <form id="series-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Mídia
                </TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Informações essenciais sobre a série
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base">
                        Nome da Série <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Breaking Bad, Game of Thrones, etc."
                        className="text-lg h-12"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="release_year"
                          className="flex items-center gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          Ano de Lançamento
                        </Label>
                        <Input
                          id="release_year"
                          name="release_year"
                          type="number"
                          min="1900"
                          max={new Date().getFullYear() + 10}
                          value={formData.release_year}
                          onChange={handleInputChange}
                          placeholder="2023"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="status"
                          className="flex items-center gap-2"
                        >
                          <Tv className="h-4 w-4" />
                          Status
                        </Label>
                        <Select
                          value={formData.status}
                          onValueChange={(
                            value: "in_progress" | "abandoned" | "completed",
                          ) => setFormData({ ...formData, status: value })}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="in_progress"
                              className="flex items-center gap-2"
                            >
                              <div className="h-2 w-2 rounded-full bg-yellow-500" />
                              Em Progresso
                            </SelectItem>
                            <SelectItem
                              value="completed"
                              className="flex items-center gap-2"
                            >
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Completada
                            </SelectItem>
                            <SelectItem
                              value="abandoned"
                              className="flex items-center gap-2"
                            >
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              Abandonada
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Série</CardTitle>
                    <CardDescription>
                      Informações adicionais e estatísticas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="total_seasons"
                            className="flex items-center gap-2"
                          >
                            <List className="h-4 w-4" />
                            Total de Temporadas
                          </Label>
                          <Input
                            id="total_seasons"
                            name="total_seasons"
                            type="number"
                            min="0"
                            value={formData.total_seasons}
                            onChange={handleInputChange}
                            placeholder="5"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="total_episodes"
                            className="flex items-center gap-2"
                          >
                            <List className="h-4 w-4" />
                            Total de Episódios
                          </Label>
                          <Input
                            id="total_episodes"
                            name="total_episodes"
                            type="number"
                            min="0"
                            value={formData.total_episodes}
                            onChange={handleInputChange}
                            placeholder="62"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="average_rating"
                            className="flex items-center gap-2"
                          >
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            Avaliação Média
                          </Label>
                          <div className="relative">
                            <Input
                              id="average_rating"
                              name="average_rating"
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={formData.average_rating}
                              onChange={handleInputChange}
                              placeholder="9.5"
                              disabled={isLoading}
                              className="pl-10"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Star className="h-4 w-4 text-yellow-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="total_watch_time"
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Tempo Total (minutos)
                          </Label>
                          <Input
                            id="total_watch_time"
                            name="total_watch_time"
                            type="number"
                            min="0"
                            value={formData.total_watch_time}
                            onChange={handleInputChange}
                            placeholder="5580"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_date">Data de Início</Label>
                            <Input
                              id="start_date"
                              name="start_date"
                              type="date"
                              value={formData.start_date}
                              onChange={handleInputChange}
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end_date">Data de Término</Label>
                            <Input
                              id="end_date"
                              name="end_date"
                              type="date"
                              value={formData.end_date}
                              onChange={handleInputChange}
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="has_special_seasons"
                              className="cursor-pointer"
                            >
                              Temporadas Especiais
                            </Label>
                            <Switch
                              id="has_special_seasons"
                              checked={formData.has_special_seasons}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  has_special_seasons: checked,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="would_recommend"
                              className="cursor-pointer"
                            >
                              Recomendaria
                            </Label>
                            <Switch
                              id="would_recommend"
                              checked={formData.would_recommend}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  would_recommend: checked,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="would_rewatch"
                              className="cursor-pointer"
                            >
                              Assistiria Novamente
                            </Label>
                            <Switch
                              id="would_rewatch"
                              checked={formData.would_rewatch}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  would_rewatch: checked,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Imagens e Mídia</CardTitle>
                    <CardDescription>
                      Adicione imagens para a série
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base">Imagem de Capa</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <div className="aspect-[2/3] rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                            {formData.cover_image ? (
                              <img
                                src={formData.cover_image}
                                alt="Cover preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Capa
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Imagem principal que aparece nos cards e listas.
                            Formato recomendado: 2:3 (vertical)
                          </p>
                          <Input
                            id="cover_image"
                            name="cover_image"
                            value={formData.cover_image}
                            onChange={handleInputChange}
                            placeholder="https://exemplo.com/capa.jpg"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base">Posters (Opcionais)</Label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="aspect-[2/3] rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                            {formData.poster_vertical ? (
                              <img
                                src={formData.poster_vertical}
                                alt="Vertical poster preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">
                                  Poster Vertical
                                </p>
                              </div>
                            )}
                          </div>
                          <Input
                            id="poster_vertical"
                            name="poster_vertical"
                            value={formData.poster_vertical}
                            onChange={handleInputChange}
                            placeholder="URL do poster vertical"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="aspect-[16/9] rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                            {formData.poster_horizontal ? (
                              <img
                                src={formData.poster_horizontal}
                                alt="Horizontal poster preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">
                                  Poster Horizontal
                                </p>
                              </div>
                            )}
                          </div>
                          <Input
                            id="poster_horizontal"
                            name="poster_horizontal"
                            value={formData.poster_horizontal}
                            onChange={handleInputChange}
                            placeholder="URL do poster horizontal"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões no rodapé também (para mobile) */}
            <div className="flex lg:hidden flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Criando..." : "Criar Série"}
              </Button>
            </div>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Como sua série aparecerá</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 relative">
                  {formData.cover_image ? (
                    <img
                      src={formData.cover_image}
                      alt="Series preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                      <Tv className="h-12 w-12 mb-4 text-gray-400" />
                      <span className="text-lg font-semibold truncate max-w-full px-2">
                        {formData.name || "Nome da Série"}
                      </span>
                      {formData.release_year && (
                        <span className="text-sm text-gray-300 mt-1">
                          {formData.release_year}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded-full ${
                        formData.status === "completed"
                          ? "bg-green-500/20 text-green-600"
                          : formData.status === "in_progress"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {formData.status === "completed"
                        ? "Completada"
                        : formData.status === "in_progress"
                          ? "Em Progresso"
                          : "Abandonada"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Temporadas</span>
                    <span className="text-sm">{formData.total_seasons}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Episódios</span>
                    <span className="text-sm">{formData.total_episodes}</span>
                  </div>

                  {formData.average_rating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Avaliação</span>
                      <span className="text-sm flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {formData.average_rating}/10
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações na sidebar (desktop) */}
            <div className="hidden lg:block">
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base gap-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Criando...
                        </div>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Criar Série
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Campos marcados com * são obrigatórios
                    </p>
                    <p>
                      Você poderá adicionar temporadas, episódios e elenco após
                      a criação.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
