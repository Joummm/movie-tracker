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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  Upload,
  Calendar,
  Globe,
  User,
  Camera,
  Sparkles,
  Check,
  X,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ActorFormProps {
  actor?: any;
  userId: string;
  isEdit?: boolean;
}

export function ActorForm({ actor, userId, isEdit = false }: ActorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    name: actor?.name || "",
    photo_url: actor?.photo_url || "",
    birth_date: actor?.birth_date || "",
    death_date: actor?.death_date || "",
    nationality: actor?.nationality || "",
    gender: actor?.gender || "not_specified",
    biography: actor?.biography || "",
    tmdb_id: actor?.tmdb_id || "",
    imdb_id: actor?.imdb_id || "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(
    actor?.photo_url || null,
  );
  const [isAlive, setIsAlive] = useState(!actor?.death_date);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Aqui você implementaria o upload real para um serviço de armazenamento
      // Por enquanto, apenas mostramos o preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, photo_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "O nome é obrigatório";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "O nome deve ter pelo menos 2 caracteres";
    }

    if (formData.birth_date && formData.death_date) {
      const birth = new Date(formData.birth_date);
      const death = new Date(formData.death_date);
      if (death < birth) {
        newErrors.death_date =
          "A data de morte não pode ser anterior à data de nascimento";
      }
    }

    if (formData.tmdb_id && !/^\d+$/.test(formData.tmdb_id)) {
      newErrors.tmdb_id = "ID TMDb deve conter apenas números";
    }

    if (formData.imdb_id && !/^nm\d+$/.test(formData.imdb_id)) {
      newErrors.imdb_id = "ID IMDb deve seguir o formato nm1234567";
    }

    // Validação de data de nascimento não futura
    if (formData.birth_date) {
      const birth = new Date(formData.birth_date);
      const today = new Date();
      if (birth > today) {
        newErrors.birth_date = "A data de nascimento não pode ser futura";
      }
    }

    // Validação de data de morte não futura
    if (formData.death_date) {
      const death = new Date(formData.death_date);
      const today = new Date();
      if (death > today) {
        newErrors.death_date = "A data de morte não pode ser futura";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const actorData: Record<string, any> = {
      user_id: userId,
      name: formData.name.trim(),
    };

    // Campos opcionais
    if (formData.photo_url.trim())
      actorData.photo_url = formData.photo_url.trim();
    if (formData.birth_date) actorData.birth_date = formData.birth_date;
    if (!isAlive && formData.death_date)
      actorData.death_date = formData.death_date;
    if (isAlive) actorData.death_date = null;
    if (formData.nationality.trim())
      actorData.nationality = formData.nationality.trim();
    if (formData.gender) actorData.gender = formData.gender;
    if (formData.biography.trim())
      actorData.biography = formData.biography.trim();
    if (formData.tmdb_id.trim()) actorData.tmdb_id = formData.tmdb_id.trim();
    if (formData.imdb_id.trim()) actorData.imdb_id = formData.imdb_id.trim();

    try {
      if (isEdit && actor) {
        const { error } = await supabase
          .from("actors")
          .update(actorData)
          .eq("id", actor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("actors")
          .insert(actorData)
          .select()
          .single();

        if (error) throw error;
      }

      // Show success message with better UX
      const successMessage = isEdit
        ? "Ator atualizado com sucesso! Redirecionando..."
        : "Ator criado com sucesso! Redirecionando...";

      alert(successMessage);

      router.push("/actors");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao salvar ator:", error);

      let errorMessage = "Erro ao salvar ator";

      if (error.code === "23505") {
        errorMessage = "Já existe um ator com este nome ou ID externo.";
      } else if (error.message.includes("network")) {
        errorMessage = "Erro de conexão. Verifique sua internet.";
      } else {
        errorMessage += ": " + error.message;
      }

      alert(errorMessage);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const getFormCompletion = () => {
    let completed = 0;
    let total = 0;

    const fields = [
      { key: "name", value: formData.name, weight: 2 },
      { key: "photo_url", value: formData.photo_url, weight: 1 },
      { key: "birth_date", value: formData.birth_date, weight: 1 },
      { key: "gender", value: formData.gender, weight: 1 },
      { key: "biography", value: formData.biography, weight: 1 },
    ];

    fields.forEach((field) => {
      total += field.weight;
      if (field.value && field.value.trim()) {
        completed += field.weight;
      }
    });

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = getFormCompletion();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 hover:bg-primary/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-border">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </AvatarFallback>
                )}
              </Avatar>
              {formData.photo_url && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-green-500 border-2 border-background">
                  <Check className="h-3 w-3 text-white" />
                </Badge>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEdit ? "Editar Ator" : "Criar Novo Ator"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEdit
                  ? "Atualize as informações do ator abaixo"
                  : "Preencha todas as informações para criar um novo ator"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Completude do formulário
            </span>
            <span className="text-sm font-bold text-primary">
              {completionPercentage}%
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completionPercentage < 50
              ? "Complete mais campos para melhorar o perfil do ator"
              : completionPercentage < 80
                ? "Bom trabalho! Alguns campos ainda podem ser preenchidos"
                : "Perfil quase completo! Excelente trabalho!"}
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-6 bg-gradient-to-r from-background via-background to-muted/5">
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Informações do Ator
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isEdit
              ? "Atualize as informações do ator abaixo"
              : "Preencha todos os campos necessários (*) para criar um novo ator"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <User className="h-4 w-4 mr-2" />
                Básico
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger
                value="external"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Globe className="h-4 w-4 mr-2" />
                Externo
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-8">
                {/* Photo Upload Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Foto do Ator
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-40 w-40 border-4 border-border shadow-lg">
                        {imagePreview ? (
                          <AvatarImage
                            src={imagePreview}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-4xl">
                            <User className="h-16 w-16" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex gap-2">
                        <Label
                          htmlFor="photo-upload"
                          className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          <Upload className="h-4 w-4 mr-2 inline" />
                          Upload Foto
                        </Label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, photo_url: "" });
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="flex items-center gap-1"
                        >
                          Nome Completo{" "}
                          <span className="text-destructive">*</span>
                          {formData.name && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {formData.name.length} caracteres
                            </Badge>
                          )}
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="Ex: Joaquim de Almeida"
                          className={errors.name ? "border-destructive" : ""}
                          disabled={isLoading}
                        />
                        {errors.name ? (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.name}
                          </p>
                        ) : (
                          formData.name && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Nome válido
                            </p>
                          )
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="photo_url"
                          className="flex items-center gap-1"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                          URL da Foto (opcional)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="photo_url"
                            value={formData.photo_url}
                            onChange={(e) =>
                              handleInputChange("photo_url", e.target.value)
                            }
                            placeholder="https://exemplo.com/foto.jpg"
                            disabled={isLoading}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cole uma URL de imagem ou faça upload de uma foto
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Biography Section */}
                <div className="space-y-4">
                  <Label
                    htmlFor="biography"
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Biografia
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="biography"
                      value={formData.biography}
                      onChange={(e) =>
                        handleInputChange("biography", e.target.value)
                      }
                      placeholder="Descreva a carreira, realizações, prêmios e fatos interessantes sobre o ator..."
                      rows={6}
                      disabled={isLoading}
                      className="min-h-[150px] resize-y"
                    />
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="outline" className="text-xs">
                        {formData.biography.length}/2000 caracteres
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>
                      Uma biografia detalhada melhora a experiência do usuário
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Personal Details Tab */}
              <TabsContent value="details" className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="birth_date"
                        className="flex items-center gap-2 mb-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Data de Nascimento
                      </Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) =>
                          handleInputChange("birth_date", e.target.value)
                        }
                        disabled={isLoading}
                        className={
                          errors.birth_date ? "border-destructive" : ""
                        }
                      />
                      {errors.birth_date && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.birth_date}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="alive-switch"
                          className="flex items-center gap-2"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          Ator está vivo?
                        </Label>
                        <Switch
                          id="alive-switch"
                          checked={isAlive}
                          onCheckedChange={setIsAlive}
                          disabled={isLoading}
                        />
                      </div>
                      {!isAlive && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="death_date"
                            className="flex items-center gap-2"
                          >
                            <Calendar className="h-4 w-4 text-rose-500" />
                            Data de Morte
                          </Label>
                          <Input
                            id="death_date"
                            type="date"
                            value={formData.death_date}
                            onChange={(e) =>
                              handleInputChange("death_date", e.target.value)
                            }
                            disabled={isLoading}
                            className={
                              errors.death_date ? "border-destructive" : ""
                            }
                          />
                          {errors.death_date && (
                            <p className="text-sm text-destructive">
                              {errors.death_date}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="nationality"
                        className="flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        Nacionalidade
                      </Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) =>
                          handleInputChange("nationality", e.target.value)
                        }
                        placeholder="ex: Portuguesa, Brasileira, Americana"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gênero</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          handleInputChange("gender", value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-blue-500" />
                              Masculino
                            </div>
                          </SelectItem>
                          <SelectItem value="female" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-pink-500" />
                              Feminino
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="non_binary"
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-purple-500" />
                              Não-binário
                            </div>
                          </SelectItem>
                          <SelectItem value="other" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-gray-500" />
                              Outro
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="not_specified"
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-muted" />
                              Não especificado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* External IDs Tab */}
              <TabsContent value="external" className="space-y-8">
                <Alert className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    IDs externos ajudam a sincronizar informações com bases de
                    dados públicas. São opcionais mas recomendados para melhor
                    integração e dados automáticos.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="tmdb_id" className="font-medium">
                        ID TMDb
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        Opcional
                      </Badge>
                    </div>
                    <Input
                      id="tmdb_id"
                      value={formData.tmdb_id}
                      onChange={(e) =>
                        handleInputChange("tmdb_id", e.target.value)
                      }
                      placeholder="12345"
                      disabled={isLoading}
                      className={errors.tmdb_id ? "border-destructive" : ""}
                    />
                    {errors.tmdb_id ? (
                      <p className="text-sm text-destructive">
                        {errors.tmdb_id}
                      </p>
                    ) : (
                      formData.tmdb_id && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Formato válido
                        </p>
                      )
                    )}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Número de identificação no The Movie Database</p>
                      <p>
                        • Encontre no site do TMDb ou em apps como Letterboxd
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="imdb_id" className="font-medium">
                        ID IMDb
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        Opcional
                      </Badge>
                    </div>
                    <Input
                      id="imdb_id"
                      value={formData.imdb_id}
                      onChange={(e) =>
                        handleInputChange("imdb_id", e.target.value)
                      }
                      placeholder="nm1234567"
                      disabled={isLoading}
                      className={errors.imdb_id ? "border-destructive" : ""}
                    />
                    {errors.imdb_id ? (
                      <p className="text-sm text-destructive">
                        {errors.imdb_id}
                      </p>
                    ) : (
                      formData.imdb_id && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Formato válido
                        </p>
                      )
                    )}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Formato: nm seguido de números (ex: nm0000158)</p>
                      <p>• Encontre na página do ator no IMDb</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Navigation and Submit */}
              <Separator />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer flex-1 sm:flex-none"
                    onClick={() => {
                      const tabs = ["basic", "details", "external"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                    disabled={activeTab === "basic"}
                  >
                    ← Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer flex-1 sm:flex-none"
                    onClick={() => {
                      const tabs = ["basic", "details", "external"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                    disabled={activeTab === "external"}
                  >
                    Próximo →
                  </Button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer flex-1 sm:flex-none hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          "Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.",
                        )
                      ) {
                        router.back();
                      }
                    }}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || completionPercentage < 30}
                    className="cursor-pointer flex-1 sm:flex-none min-w-32 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEdit ? "Atualizando..." : "Criando..."}
                      </>
                    ) : isEdit ? (
                      "Atualizar Ator"
                    ) : (
                      "Criar Ator"
                    )}
                  </Button>
                </div>
              </div>

              {completionPercentage < 30 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription className="text-sm">
                    Complete pelo menos 30% do formulário (nome e mais um campo)
                    para poder salvar.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
