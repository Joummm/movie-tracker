// components/series/forms/new-season-form.tsx (corrigido com verificação melhorada)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Calendar,
  Tv,
  Image as ImageIcon,
  Hash,
  Plus,
  ArrowLeft,
  X,
  Sparkles,
  Info,
  Eye,
  Palette,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  existingSeasons,
}: NewSeasonFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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
    release_year: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const handleImageError = (field: string) => {
    setImageErrors((prev) => ({ ...prev, [field]: true }));
  };

  const checkIfSeasonExists = async (
    seasonNumber: number,
    isSpecial: boolean,
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("series_seasons")
        .select("id")
        .eq("series_id", seriesId)
        .eq("season_number", seasonNumber)
        .eq("is_special", isSpecial)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Erro ao verificar temporada:", error);
        return false; // Assume que não existe se houver erro
      }

      return !!data; // Retorna true se encontrar dados
    } catch (error) {
      console.error("Erro ao verificar temporada:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.season_number) {
      toast.error("Número da temporada obrigatório", {
        description: "Por favor, insira o número da temporada.",
        duration: 4000,
      });
      return;
    }

    const seasonNumber = parseInt(formData.season_number);
    if (isNaN(seasonNumber) || seasonNumber < 0) {
      toast.error("Número inválido", {
        description: "O número da temporada deve ser um valor válido.",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se a temporada já existe no banco de dados
      const seasonExists = await checkIfSeasonExists(
        seasonNumber,
        formData.is_special,
      );

      if (seasonExists) {
        toast.error("Temporada já existe", {
          description: `Já existe uma ${formData.is_special ? "temporada especial" : "temporada"} com o número ${seasonNumber} nesta série.`,
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      // Verificar também nos existingSeasons locais
      const localSeasonExists = existingSeasons.some(
        (s) =>
          s.season_number === seasonNumber &&
          s.is_special === formData.is_special,
      );

      if (localSeasonExists) {
        toast.error("Temporada já existe", {
          description: `Já existe uma ${formData.is_special ? "temporada especial" : "temporada"} com o número ${seasonNumber}.`,
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      // Create season data
      const seasonData = {
        series_id: seriesId,
        user_id: userId,
        season_number: seasonNumber,
        name: formData.name || null,
        is_special: formData.is_special,
        special_type:
          formData.is_special && formData.special_type
            ? formData.special_type
            : null,
        episode_count: 0,
        watched_episode_count: 0,
        poster_vertical: formData.poster_vertical || null,
        poster_horizontal: formData.poster_horizontal || null,
        release_year: formData.release_year
          ? parseInt(formData.release_year)
          : null,
        average_rating: null,
        total_watch_time: 0,
      };

      console.log("Criando temporada com dados:", seasonData);

      const { data: newSeason, error: seasonError } = await supabase
        .from("series_seasons")
        .insert([seasonData])
        .select()
        .single();

      if (seasonError) {
        console.error("Erro do Supabase ao criar temporada:", seasonError);

        if (seasonError.code === "23505") {
          // Código de violação de constraint única
          toast.error("Temporada já existe", {
            description: `Já existe uma ${formData.is_special ? "temporada especial" : "temporada"} com o número ${seasonNumber} nesta série.`,
            duration: 5000,
          });
        } else {
          throw new Error(
            `Erro ao criar temporada: ${seasonError.message || "Erro desconhecido"}`,
          );
        }
        setIsLoading(false);
        return;
      }

      // Tentar atualizar o contador de temporadas da série
      try {
        const { error: seriesUpdateError } = await supabase
          .from("series")
          .update({
            total_seasons: existingSeasons.length + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", seriesId);

        if (seriesUpdateError) {
          console.warn(
            "Temporada criada, mas não foi possível atualizar contador da série:",
            seriesUpdateError,
          );
        }
      } catch (updateError) {
        console.warn(
          "Erro ao atualizar série, mas a temporada foi criada:",
          updateError,
        );
      }

      toast.success("Temporada criada com sucesso!", {
        description: `A ${formData.is_special ? "temporada especial" : `temporada ${seasonNumber}`} foi adicionada à série "${seriesName}".`,
        duration: 4000,
      });

      // Redirecionar após 1.5 segundos
      setTimeout(() => {
        router.push(`/series/${seriesId}/seasons/${newSeason.id}/episodes`);
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Erro completo ao criar temporada:", error);
      toast.error("Erro ao criar temporada", {
        description:
          error.message || "Ocorreu um erro inesperado. Tente novamente.",
        duration: 5000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/series/${seriesId}`)}
            className="mb-6 gap-2 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para série
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-linear-to-br from-primary/10 to-primary/5">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-blue-600 bg-clip-text text-transparent">
                  Nova Temporada
                </h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Adicione uma nova temporada à série "
                <span className="font-semibold text-primary">{seriesName}</span>
                "
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/series/${seriesId}`)}
                disabled={isLoading}
                className="gap-2 border-border/50 hover:border-primary/30"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                form="new-season-form"
                disabled={isLoading}
                className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar Temporada
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="bg-linear-to-r from-primary/5 via-primary/5 to-transparent p-1">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="px-4 md:px-6 pt-4">
                    <TabsList className="grid grid-cols-2 w-full bg-background/50 border border-border/30">
                      <TabsTrigger
                        value="basic"
                        className="flex items-center gap-2 py-2.5 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <Info className="h-4 w-4" />
                        <span className="hidden sm:inline">Básico</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="media"
                        className="flex items-center gap-2 py-2.5 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Imagens</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Basic Tab */}
                  <TabsContent value="basic" className="m-0 p-4 md:p-6">
                    <form id="new-season-form" onSubmit={handleSubmit}>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label
                              htmlFor="season_number"
                              className="text-base font-semibold mb-2 flex items-center gap-2"
                            >
                              <Hash className="h-4 w-4 text-primary" />
                              Número da Temporada
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              id="season_number"
                              name="season_number"
                              type="number"
                              min="0"
                              value={formData.season_number}
                              onChange={handleInputChange}
                              placeholder="1"
                              className="h-12 text-lg border-border/50 focus:border-primary focus:ring-primary/20"
                              required
                              disabled={isLoading}
                            />
                            <div className="flex items-start gap-2 mt-2">
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                Próximo número sugerido: {nextSeasonNumber}.
                                Certifique-se que o número não está sendo usado
                                por outra temporada.
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor="release_year"
                              className="text-base font-semibold mb-2 flex items-center gap-2"
                            >
                              <Calendar className="h-4 w-4 text-blue-500" />
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
                              className="h-12 border-border/50"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="name"
                            className="text-base font-semibold mb-2 flex items-center gap-2"
                          >
                            <Tv className="h-4 w-4 text-primary" />
                            Nome da Temporada (opcional)
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Ex: A Nova Era, Renascimento, etc."
                            className="border-border/50"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="bg-linear-to-br from-card to-card/80 rounded-lg border border-border/30 p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                Temporada Especial
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Esta temporada é um especial, OVA ou conteúdo
                                extra?
                              </p>
                            </div>
                            <Switch
                              id="is_special"
                              checked={formData.is_special}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  is_special: checked,
                                  special_type: checked ? "" : "",
                                })
                              }
                              disabled={isLoading}
                              className="data-[state=checked]:bg-purple-500"
                            />
                          </div>

                          {formData.is_special && (
                            <div className="mt-4 space-y-2">
                              <Label htmlFor="special_type">
                                Tipo de Especial
                              </Label>
                              <Select
                                value={formData.special_type}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    special_type: value,
                                  })
                                }
                                disabled={isLoading}
                              >
                                <SelectTrigger className="border-border/50">
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="holiday">
                                    Feriado/Natal
                                  </SelectItem>
                                  <SelectItem value="anniversary">
                                    Aniversário
                                  </SelectItem>
                                  <SelectItem value="reunion">
                                    Reunião
                                  </SelectItem>
                                  <SelectItem value="finale">Final</SelectItem>
                                  <SelectItem value="prequel">
                                    Prequel
                                  </SelectItem>
                                  <SelectItem value="spin_off">
                                    Spin-off
                                  </SelectItem>
                                  <SelectItem value="special">
                                    Especial
                                  </SelectItem>
                                  <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Media Tab */}
                  <TabsContent value="media" className="m-0 p-4 md:p-6">
                    <form id="new-season-form" onSubmit={handleSubmit}>
                      <div className="space-y-8">
                        {/* Poster Vertical */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <Palette className="h-4 w-4 text-primary" />
                                Poster Vertical (opcional)
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Esta imagem será usada como capa da temporada
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Opcional
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Preview */}
                            <div className="lg:col-span-1">
                              <div className="aspect-2/3 rounded-lg border-2 border-dashed border-border/50 overflow-hidden bg-linear-to-br from-muted/20 to-muted/10">
                                {formData.poster_vertical &&
                                !imageErrors.poster_vertical ? (
                                  <img
                                    src={formData.poster_vertical}
                                    alt="Poster vertical preview"
                                    className="w-full h-full object-cover"
                                    onError={() =>
                                      handleImageError("poster_vertical")
                                    }
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                                    <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-sm font-medium text-center">
                                      {imageErrors.poster_vertical
                                        ? "URL inválida"
                                        : "Sem poster"}
                                    </p>
                                    <p className="text-xs mt-1 text-center">
                                      Proporção 2:3
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Input e informações */}
                            <div className="lg:col-span-2 space-y-4">
                              <div>
                                <Label
                                  htmlFor="poster_vertical"
                                  className="text-sm font-medium mb-2"
                                >
                                  URL do Poster Vertical
                                </Label>
                                <Input
                                  id="poster_vertical"
                                  name="poster_vertical"
                                  value={formData.poster_vertical}
                                  onChange={handleInputChange}
                                  placeholder="https://exemplo.com/poster-vertical.jpg"
                                  className="border-border/50"
                                  disabled={isLoading}
                                />
                              </div>

                              <div className="bg-linear-to-r from-blue-500/5 to-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                <div className="flex items-start gap-2">
                                  <Eye className="h-4 w-4 text-blue-500 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-blue-600">
                                      Recomendações
                                    </p>
                                    <div className="text-xs text-blue-500/80 space-y-1">
                                      <p>
                                        • Proporção ideal: 2:3 (ex: 667×1000px)
                                      </p>
                                      <p>
                                        • Formatos suportados: JPG, PNG, WebP
                                      </p>
                                      <p>
                                        • Se não adicionar, será usada a imagem
                                        da série
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Poster Horizontal */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <Wand2 className="h-4 w-4 text-primary" />
                                Poster Horizontal (opcional)
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Para banners e cabeçalhos
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Opcional
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Preview */}
                            <div className="lg:col-span-1">
                              <div className="aspect-video rounded-lg border-2 border-dashed border-border/50 overflow-hidden bg-linear-to-br from-muted/20 to-muted/10">
                                {formData.poster_horizontal &&
                                !imageErrors.poster_horizontal ? (
                                  <img
                                    src={formData.poster_horizontal}
                                    alt="Poster horizontal preview"
                                    className="w-full h-full object-cover"
                                    onError={() =>
                                      handleImageError("poster_horizontal")
                                    }
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                                    <ImageIcon className="h-10 w-10 mb-3 opacity-50" />
                                    <p className="text-sm font-medium text-center">
                                      {imageErrors.poster_horizontal
                                        ? "URL inválida"
                                        : "Sem banner"}
                                    </p>
                                    <p className="text-xs mt-1 text-center">
                                      Proporção 16:9
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Input */}
                            <div className="lg:col-span-2 space-y-4">
                              <div>
                                <Label
                                  htmlFor="poster_horizontal"
                                  className="text-sm font-medium mb-2"
                                >
                                  URL do Poster Horizontal
                                </Label>
                                <Input
                                  id="poster_horizontal"
                                  name="poster_horizontal"
                                  value={formData.poster_horizontal}
                                  onChange={handleInputChange}
                                  placeholder="https://exemplo.com/poster-horizontal.jpg"
                                  className="border-border/50"
                                  disabled={isLoading}
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Proporção 16:9
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  ~1920×1080px
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </div>

          {/* Preview & Info Section - 1/3 width */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  Como a temporada aparecerá após criação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Poster Preview */}
                <div className="relative aspect-2/3 rounded-lg overflow-hidden border border-border/30 bg-linear-to-br from-muted/20 to-muted/10">
                  {formData.poster_vertical && !imageErrors.poster_vertical ? (
                    <>
                      <img
                        src={formData.poster_vertical}
                        alt="Season preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                      <Tv className="h-16 w-16 mb-4 opacity-50" />
                      <p className="font-semibold text-center">
                        {formData.is_special
                          ? "Especial"
                          : `Temporada ${formData.season_number || "1"}`}
                      </p>
                      {formData.name && (
                        <p className="text-sm mt-2">{formData.name}</p>
                      )}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`${formData.is_special ? "bg-purple-500" : "bg-blue-500"} border-none text-white shadow-md`}
                    >
                      {formData.is_special ? "Especial" : "Regular"}
                    </Badge>
                  </div>
                </div>

                {/* Season Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg truncate">
                      {formData.is_special
                        ? "Especial"
                        : `Temporada ${formData.season_number || "1"}`}
                      {formData.name && `: ${formData.name}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {formData.release_year && (
                        <Badge variant="outline" className="text-xs">
                          {formData.release_year}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-xs bg-muted/50 border-muted"
                      >
                        {seriesName}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-linear-to-br from-muted/20 to-muted/10 rounded p-2 border border-border/20">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-semibold text-sm truncate">
                        {formData.is_special ? "Especial" : "Regular"}
                      </p>
                    </div>

                    <div className="bg-linear-to-br from-muted/20 to-muted/10 rounded p-2 border border-border/20">
                      <p className="text-xs text-muted-foreground">Número</p>
                      <p className="font-semibold text-sm">
                        {formData.season_number || "1"}
                      </p>
                    </div>
                  </div>

                  {/* Special Type */}
                  {formData.is_special && formData.special_type && (
                    <div className="bg-linear-to-br from-purple-500/10 to-purple-500/5 rounded p-2 border border-purple-500/20">
                      <p className="text-xs text-purple-600">
                        Tipo de Especial
                      </p>
                      <p className="font-semibold text-sm text-purple-600">
                        {formData.special_type}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card className="border-border/50 bg-linear-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Informações Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    Campos obrigatórios:
                  </p>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Número da temporada
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    Restrições importantes:
                  </p>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>
                        Não pode haver duas temporadas com o mesmo número
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>
                        Temporadas especiais e regulares têm números separados
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    Campos calculados automaticamente:
                  </p>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Total de episódios
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Episódios assistidos
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Avaliação média
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Tempo total de visualização
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/30">
                  <p className="font-medium text-foreground mb-1">
                    Próximos passos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Após criar a temporada, podes adicionar episódios na página
                    da temporada.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
