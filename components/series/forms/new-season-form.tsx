// components/series/forms/new-season-form.tsx (versão simplificada)
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Tv,
  Film,
  Star,
  Clock,
  Image as ImageIcon,
  Hash,
  Award,
  Plus,
  ArrowLeft,
  Save,
  X,
  Sparkles,
  List
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ExistingSeason {
  season_number: number;
  is_special: boolean;
}

interface NewSeasonFormProps {
  userId: string;
  seriesId: string;
  seriesName: string;
  nextSeasonNumber: number;
  existingSeasons: ExistingSeason[];
}

export function NewSeasonForm({ 
  userId, 
  seriesId, 
  seriesName, 
  nextSeasonNumber,
  existingSeasons 
}: NewSeasonFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    // Basic info
    season_number: nextSeasonNumber.toString(),
    name: "",
    is_special: false,
    special_type: "",
    // Media
    poster_vertical: "",
    poster_horizontal: "",
    // Details
    episode_count: "",
    watched_episode_count: "0",
    release_year: "",
    average_rating: "",
    total_watch_time: "0",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : value,
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
    
    if (!formData.season_number) {
      alert("Por favor, insira o número da temporada.");
      return;
    }

    const seasonNumber = parseInt(formData.season_number);
    if (isNaN(seasonNumber)) {
      alert("Número da temporada inválido.");
      return;
    }

    // Check if season number already exists
    const seasonExists = existingSeasons.some(
      s => s.season_number === seasonNumber && s.is_special === formData.is_special
    );
    
    if (seasonExists) {
      alert(`Já existe uma ${formData.is_special ? 'temporada especial' : 'temporada'} com o número ${seasonNumber}.`);
      return;
    }

    setIsLoading(true);

    try {
      // Create season data
      const seasonData = {
        series_id: seriesId,
        user_id: userId,
        season_number: seasonNumber,
        name: formData.name || null,
        is_special: formData.is_special,
        special_type: formData.is_special && formData.special_type ? formData.special_type : null,
        episode_count: formData.episode_count ? parseInt(formData.episode_count) : 0,
        watched_episode_count: formData.watched_episode_count ? parseInt(formData.watched_episode_count) : 0,
        poster_vertical: formData.poster_vertical || null,
        poster_horizontal: formData.poster_horizontal || null,
        release_year: formData.release_year ? parseInt(formData.release_year) : null,
        average_rating: formData.average_rating ? parseFloat(formData.average_rating) : null,
        total_watch_time: formData.total_watch_time ? parseInt(formData.total_watch_time) : 0,
      };

      const { data: newSeason, error: seasonError } = await supabase
        .from("series_seasons")
        .insert([seasonData])
        .select()
        .single();

      if (seasonError) throw seasonError;

      // Update series total seasons count
      const { error: seriesUpdateError } = await supabase
        .from("series")
        .update({ 
          total_seasons: existingSeasons.length + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", seriesId);

      if (seriesUpdateError) throw seriesUpdateError;

      alert("Temporada criada com sucesso!");
      router.push(`/series/${seriesId}`);
      router.refresh();
      
    } catch (error: any) {
      console.error("Erro ao criar temporada:", error);
      alert(`Erro ao criar temporada: ${error.message}`);
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
            <h1 className="text-3xl font-bold tracking-tight">Nova Temporada</h1>
            <div className="text-muted-foreground">
              Adicione uma nova temporada à série "{seriesName}"
            </div>
          </div>
        </div>
        
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
            form="season-form"
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "Criando..." : "Criar Temporada"}
          </Button>
        </div>
      </div>

      <form id="season-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Tv className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
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
                      Informações essenciais sobre a temporada
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="season_number" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Número da Temporada <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="season_number"
                          name="season_number"
                          type="number"
                          min="0"
                          value={formData.season_number}
                          onChange={handleInputChange}
                          placeholder="1"
                          disabled={isLoading}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Próximo número sugerido: {nextSeasonNumber}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <Tv className="h-4 w-4" />
                          Nome da Temporada
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Ex: A Nova Era, Renascimento, etc."
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="is_special" className="cursor-pointer flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Temporada Especial
                        </Label>
                        <Switch
                          id="is_special"
                          checked={formData.is_special}
                          onCheckedChange={(checked) =>
                            setFormData({...formData, is_special: checked})
                          }
                          disabled={isLoading}
                        />
                      </div>

                      {formData.is_special && (
                        <div className="space-y-2">
                          <Label htmlFor="special_type">Tipo de Especial</Label>
                          <Select
                            value={formData.special_type}
                            onValueChange={(value) =>
                              setFormData({...formData, special_type: value})
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="holiday">Feriado/Natal</SelectItem>
                              <SelectItem value="anniversary">Aniversário</SelectItem>
                              <SelectItem value="reunion">Reunião</SelectItem>
                              <SelectItem value="finale">Final</SelectItem>
                              <SelectItem value="prequel">Prequel</SelectItem>
                              <SelectItem value="spin_off">Spin-off</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Temporada</CardTitle>
                    <CardDescription>
                      Informações adicionais e estatísticas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="episode_count" className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            Total de Episódios
                          </Label>
                          <Input
                            id="episode_count"
                            name="episode_count"
                            type="number"
                            min="0"
                            value={formData.episode_count}
                            onChange={handleInputChange}
                            placeholder="10"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="watched_episode_count" className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Episódios Assistidos
                          </Label>
                          <Input
                            id="watched_episode_count"
                            name="watched_episode_count"
                            type="number"
                            min="0"
                            value={formData.watched_episode_count}
                            onChange={handleInputChange}
                            placeholder="0"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="release_year" className="flex items-center gap-2">
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
                            placeholder="2024"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="average_rating" className="flex items-center gap-2">
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
                              placeholder="8.5"
                              disabled={isLoading}
                              className="pl-10"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Star className="h-4 w-4 text-yellow-500" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="total_watch_time" className="flex items-center gap-2">
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
                            placeholder="600"
                            disabled={isLoading}
                          />
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
                    <CardTitle>Imagens da Temporada</CardTitle>
                    <CardDescription>
                      Adicione imagens específicas para esta temporada
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                                <p className="text-xs text-muted-foreground">Poster Vertical</p>
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
                          <p className="text-xs text-muted-foreground">
                            Formato recomendado: 2:3
                          </p>
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
                                <p className="text-xs text-muted-foreground">Poster Horizontal</p>
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
                          <p className="text-xs text-muted-foreground">
                            Formato recomendado: 16:9
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Se não adicionar imagens específicas, será usada a imagem da série
                      </p>
                      <p>
                        A imagem vertical aparecerá nos cards e lista de temporadas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Como sua temporada aparecerá
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 relative">
                  {formData.poster_vertical ? (
                    <img
                      src={formData.poster_vertical}
                      alt="Season preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                      <Tv className="h-12 w-12 mb-4 text-gray-400" />
                      <div className="text-lg font-semibold">
                        {formData.is_special ? 'Especial' : `Temporada ${formData.season_number}`}
                      </div>
                      {formData.name && (
                        <div className="text-sm text-gray-300 mt-1 truncate max-w-full">
                          {formData.name}
                        </div>
                      )}
                      {formData.release_year && (
                        <div className="text-xs text-gray-400 mt-1">
                          {formData.release_year}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tipo</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      formData.is_special ? 'bg-purple-500/20 text-purple-600' : 'bg-blue-500/20 text-blue-600'
                    }`}>
                      {formData.is_special ? 'Especial' : 'Regular'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Episódios</span>
                    <span className="text-sm">
                      {formData.watched_episode_count || 0}/{formData.episode_count || 0}
                    </span>
                  </div>

                  {formData.release_year && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ano</span>
                      <span className="text-sm">{formData.release_year}</span>
                    </div>
                  )}

                  {formData.average_rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Avaliação</span>
                      <span className="text-sm flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {formData.average_rating}/10
                      </span>
                    </div>
                  )}

                  {formData.total_watch_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Duração</span>
                      <span className="text-sm">
                        {Math.round(parseInt(formData.total_watch_time || "0") / 60)}h
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
                          Criar Temporada
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

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push(`/series/${seriesId}`)}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para Série
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Campos marcados com * são obrigatórios
                    </div>
                    <p>
                      Você poderá adicionar episódios e editar informações após a criação.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Botões no rodapé para mobile */}
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
            {isLoading ? "Criando..." : "Criar Temporada"}
          </Button>
        </div>
      </form>
    </div>
  );
}