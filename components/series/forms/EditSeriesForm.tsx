// components/series/forms/edit-series-form.tsx
"use client";

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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Film,
  Calendar,
  Image as ImageIcon,
  Save,
  X,
  Tv2,
  CheckCircle2,
  Play,
  AlertCircle,
  Settings,
  Info,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  Palette,
  Wand2,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditSeriesFormProps {
  series: any;
}

export function EditSeriesForm({ series }: EditSeriesFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: series.name || "",
    poster_vertical: series.poster_vertical || series.cover_image || "",
    poster_horizontal: series.poster_horizontal || "",
    release_year: series.release_year?.toString() || "",
    status: series.status || "in_progress",
    would_recommend: series.would_recommend ?? null,
    would_rewatch: series.would_rewatch ?? null,
    has_special_seasons: series.has_special_seasons || false,
    start_date: series.start_date || "",
    end_date: series.end_date || "",
    description: series.description || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro de imagem ao editar o URL
    if (name.includes("poster")) {
      setImageErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleImageError = (field: string) => {
    setImageErrors((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    try {
      // O poster_vertical serve também como cover_image
      const updateData = {
        name: formData.name,
        release_year: formData.release_year
          ? parseInt(formData.release_year)
          : null,
        cover_image: formData.poster_vertical || null, // Usar poster_vertical como cover_image
        status: formData.status,
        poster_vertical: formData.poster_vertical || null,
        poster_horizontal: formData.poster_horizontal || null,
        would_recommend: formData.would_recommend,
        would_rewatch: formData.would_rewatch,
        has_special_seasons: formData.has_special_seasons,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      };

      console.log("Updating series with data:", updateData);

      const { error } = await supabase
        .from("series")
        .update(updateData)
        .eq("id", series.id);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success("Série atualizada com sucesso!", {
        description: "As alterações foram guardadas.",
        duration: 3000,
      });

      setTimeout(() => {
        router.push(`/series/${series.id}`);
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao atualizar série:", error);
      toast.error("Erro ao atualizar série", {
        description: error.message || "Ocorreu um erro inesperado",
        duration: 5000,
      });
      setIsLoading(false);
    }
  };

  const statusOptions = [
    {
      value: "in_progress",
      label: "Em Progresso",
      icon: Play,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      value: "completed",
      label: "Completada",
      icon: CheckCircle2,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
    },
    {
      value: "abandoned",
      label: "Abandonada",
      icon: AlertCircle,
      color: "bg-rose-500",
      textColor: "text-rose-600",
    },
  ];

  const getStatusInfo = (status: string) => {
    return (
      statusOptions.find((opt) => opt.value === status) || statusOptions[0]
    );
  };

  const currentStatus = getStatusInfo(formData.status);

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/series/${series.id}`)}
            className="mb-6 gap-2 hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
            Voltar para a série
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-blue-600 bg-clip-text text-transparent">
                Editar Série
              </h1>
              <p className="text-muted-foreground mt-2">
                Atualizando:{" "}
                <span className="font-semibold text-primary">
                  {series.name}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/series/${series.id}`)}
                disabled={isLoading}
                className="gap-2 border-border/50 hover:border-primary/30"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                form="edit-series-form"
                disabled={isLoading}
                className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Layout corrigido - sem sticky para evitar sobreposição */}
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
                    <TabsList className="grid grid-cols-3 w-full bg-background/50 border border-border/30">
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
                      <TabsTrigger
                        value="advanced"
                        className="flex items-center gap-2 py-2.5 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Avançado</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Basic Tab */}
                  <TabsContent value="basic" className="m-0 p-4 md:p-6">
                    <div className="space-y-6">
                      <div>
                        <Label
                          htmlFor="name"
                          className="text-base font-semibold mb-2 flex items-center gap-2"
                        >
                          <Film className="h-4 w-4 text-primary" />
                          Nome da Série
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Breaking Bad, Game of Thrones, etc."
                          className="h-12 text-lg border-border/50 focus:border-primary focus:ring-primary/20"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label
                            htmlFor="release_year"
                            className="text-sm font-medium mb-2 flex items-center gap-2"
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
                            placeholder="2023"
                            className="border-border/50"
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="status"
                            className="text-sm font-medium mb-2 flex items-center gap-2"
                          >
                            <Tv2 className="h-4 w-4 text-purple-500" />
                            Status
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(
                              value: "in_progress" | "abandoned" | "completed",
                            ) => setFormData({ ...formData, status: value })}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="border-border/50">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="focus:bg-primary/5"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Icon
                                        className={`h-4 w-4 ${option.textColor}`}
                                      />
                                      <span>{option.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="description"
                          className="text-sm font-medium mb-2"
                        >
                          Descrição
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Descreva a série, o enredo, ou notas pessoais..."
                          rows={4}
                          className="border-border/50 resize-none"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label
                            htmlFor="start_date"
                            className="text-sm font-medium mb-2"
                          >
                            Data de Início
                          </Label>
                          <Input
                            id="start_date"
                            name="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={handleInputChange}
                            className="border-border/50"
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="end_date"
                            className="text-sm font-medium mb-2"
                          >
                            Data de Término
                          </Label>
                          <Input
                            id="end_date"
                            name="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={handleInputChange}
                            className="border-border/50"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Media Tab - Layout melhorado */}
                  <TabsContent value="media" className="m-0 p-4 md:p-6">
                    <div className="space-y-8">
                      {/* Poster Vertical */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Palette className="h-4 w-4 text-primary" />
                              Poster Vertical
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Esta imagem será usada como capa principal
                            </p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            Principal
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
                                    <p>• Formatos suportados: JPG, PNG, WebP</p>
                                    <p>
                                      • Use serviços como TMDB ou TVDB para
                                      imagens de qualidade
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
                              Poster Horizontal
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Para banners e cabeçalhos (opcional)
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
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="m-0 p-4 md:p-6">
                    <div className="space-y-6">
                      {/* Special Seasons */}
                      <div className="bg-linear-to-br from-card to-card/80 rounded-lg border border-border/30 p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Tv2 className="h-4 w-4 text-purple-500" />
                              Temporadas Especiais
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Esta série contém temporadas especiais, OVAs ou
                              conteúdo extra?
                            </p>
                          </div>
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
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Would Recommend */}
                        <div className="bg-linear-to-br from-card to-card/80 rounded-lg border border-border/30 p-4">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                                Recomendaria?
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Recomendarias a outros utilizadores?
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  formData.would_recommend === true
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    would_recommend: true,
                                  })
                                }
                                disabled={isLoading}
                                className={`flex-1 ${formData.would_recommend === true ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  formData.would_recommend === false
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    would_recommend: false,
                                  })
                                }
                                disabled={isLoading}
                                className={`flex-1 ${formData.would_recommend === false ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                              >
                                Não
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  formData.would_recommend === null
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    would_recommend: null,
                                  })
                                }
                                disabled={isLoading}
                                className="flex-1"
                              >
                                -
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Would Rewatch */}
                        <div className="bg-linear-to-br from-card to-card/80 rounded-lg border border-border/30 p-4">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-blue-500" />
                                Assistiria novamente?
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Verias esta série novamente no futuro?
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  formData.would_rewatch === true
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    would_rewatch: true,
                                  })
                                }
                                disabled={isLoading}
                                className={`flex-1 ${formData.would_rewatch === true ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  formData.would_rewatch === false
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    would_rewatch: false,
                                  })
                                }
                                disabled={isLoading}
                                className={`flex-1 ${formData.would_rewatch === false ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                              >
                                Não
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  formData.would_rewatch === null
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    would_rewatch: null,
                                  })
                                }
                                disabled={isLoading}
                                className="flex-1"
                              >
                                -
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                  <Sparkles className="h-5 w-5 text-primary" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  Como a série aparecerá após guardar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Poster Preview */}
                <div className="relative aspect-2/3 rounded-lg overflow-hidden border border-border/30 bg-linear-to-br from-muted/20 to-muted/10">
                  {formData.poster_vertical && !imageErrors.poster_vertical ? (
                    <>
                      <img
                        src={formData.poster_vertical}
                        alt="Series preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                      <Film className="h-16 w-16 mb-4 opacity-50" />
                      <p className="font-semibold text-center">
                        {formData.name || "Nome da Série"}
                      </p>
                      {formData.release_year && (
                        <p className="text-sm mt-2">{formData.release_year}</p>
                      )}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`${currentStatus.color} border-none text-white shadow-md`}
                    >
                      <currentStatus.icon className="h-3 w-3 mr-1" />
                      {currentStatus.label}
                    </Badge>
                  </div>
                </div>

                {/* Series Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg truncate">
                      {formData.name || "Série sem nome"}
                    </h3>
                    {formData.release_year && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Lançamento:{" "}
                        <span className="font-medium">
                          {formData.release_year}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-linear-to-br from-muted/20 to-muted/10 rounded p-2 border border-border/20">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-semibold text-sm truncate">
                        {currentStatus.label}
                      </p>
                    </div>

                    {formData.has_special_seasons && (
                      <div className="bg-linear-to-br from-purple-500/10 to-purple-500/5 rounded p-2 border border-purple-500/20">
                        <p className="text-xs text-purple-600">Especial</p>
                        <p className="font-semibold text-sm text-purple-600">
                          Temporadas especiais
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preferences */}
                  {(formData.would_recommend !== null ||
                    formData.would_rewatch !== null) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Preferências
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {formData.would_recommend === true && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                          >
                            Recomendaria
                          </Badge>
                        )}
                        {formData.would_recommend === false && (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs"
                          >
                            Não recomendaria
                          </Badge>
                        )}
                        {formData.would_rewatch === true && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"
                          >
                            Assistiria novamente
                          </Badge>
                        )}
                        {formData.would_rewatch === false && (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs"
                          >
                            Não assistiria
                          </Badge>
                        )}
                      </div>
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
                    Campos automáticos:
                  </p>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Tempo total de visualização
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Avaliação média
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Total de temporadas
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      Total de episódios
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/30">
                  <p className="font-medium text-foreground mb-1">
                    Próximos passos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Após guardar, podes adicionar temporadas e episódios na
                    página da série.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden Form */}
        <form
          id="edit-series-form"
          onSubmit={handleSubmit}
          className="hidden"
        />
      </div>
    </div>
  );
}
