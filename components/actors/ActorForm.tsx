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
import {
  Loader2,
  ArrowLeft,
  Upload,
  Calendar,
  Globe,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    gender: actor?.gender || "other",
    biography: actor?.biography || "",
    tmdb_id: actor?.tmdb_id || "",
    imdb_id: actor?.imdb_id || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "O nome é obrigatório";
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
    if (formData.death_date) actorData.death_date = formData.death_date;
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

      // Show success message
      alert(
        isEdit ? "Ator atualizado com sucesso!" : "Ator criado com sucesso!",
      );

      router.push("/actors");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao salvar ator:", error);

      if (error.code === "23505") {
        alert("Já existe um ator com este nome ou ID externo.");
      } else {
        alert("Erro ao salvar ator: " + error.message);
      }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={formData.photo_url} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">
            {isEdit ? "Editar Ator" : "Novo Ator"}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Informações do Ator</CardTitle>
          <CardDescription>
            {isEdit
              ? "Atualize as informações do ator abaixo"
              : "Preencha todas as informações do ator"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="cursor-pointer">
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="details" className="cursor-pointer">
                Detalhes Pessoais
              </TabsTrigger>
              <TabsTrigger value="external" className="cursor-pointer">
                IDs Externos
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Nome completo do ator"
                      className={errors.name ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo_url">URL da Foto</Label>
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
                      {/* <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const url = prompt("Cole a URL da foto:");
                          if (url) handleInputChange("photo_url", url);
                        }}
                      >
                        <Upload className="h-4 w-4" />
                      </Button> */}
                    </div>
                    {formData.photo_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={formData.photo_url} alt="Preview" />
                          <AvatarFallback>Preview</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          Pré-visualização
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biography">Biografia</Label>
                  <Textarea
                    id="biography"
                    value={formData.biography}
                    onChange={(e) =>
                      handleInputChange("biography", e.target.value)
                    }
                    placeholder="Descreva a carreira e realizações do ator..."
                    rows={5}
                    disabled={isLoading}
                    className="resize-none"
                  />
                </div>
              </TabsContent>

              {/* Personal Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="birth_date"
                      className="flex items-center gap-1"
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="death_date"
                      className="flex items-center gap-1"
                    >
                      <Calendar className="h-4 w-4" />
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
                      className={errors.death_date ? "border-destructive" : ""}
                    />
                    {errors.death_date && (
                      <p className="text-sm text-destructive">
                        {errors.death_date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="nationality"
                      className="flex items-center gap-1"
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
                          Masculino
                        </SelectItem>
                        <SelectItem value="female" className="cursor-pointer">
                          Feminino
                        </SelectItem>
                        <SelectItem
                          value="non_binary"
                          className="cursor-pointer"
                        >
                          Não-binário
                        </SelectItem>
                        <SelectItem value="other" className="cursor-pointer">
                          Outro
                        </SelectItem>
                        <SelectItem
                          value="not_specified"
                          className="cursor-pointer"
                        >
                          Não especificado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* External IDs Tab */}
              <TabsContent value="external" className="space-y-6">
                <Alert>
                  <AlertDescription className="text-sm">
                    IDs externos ajudam a sincronizar informações com bases de
                    dados públicas. São opcionais mas recomendados para melhor
                    integração.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tmdb_id">ID TMDb</Label>
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
                    {errors.tmdb_id && (
                      <p className="text-sm text-destructive">
                        {errors.tmdb_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Número de identificação no The Movie Database
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imdb_id">ID IMDb</Label>
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
                    {errors.imdb_id && (
                      <p className="text-sm text-destructive">
                        {errors.imdb_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Formato: nm seguido de números (ex: nm0000158)
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Navigation and Submit */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => {
                      const tabs = ["basic", "details", "external"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                    disabled={activeTab === "basic"}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => {
                      const tabs = ["basic", "details", "external"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                    disabled={activeTab === "external"}
                  >
                    Próximo
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-30 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : isEdit ? (
                      "Atualizar Ator"
                    ) : (
                      "Criar Ator"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
