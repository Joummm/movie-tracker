// app/people/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Save,
  Upload,
  User,
  Calendar,
  MapPin,
  Flag,
  Award,
  Link as LinkIcon,
  X,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function NewPersonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    photo_url: "",
    birth_date: "",
    death_date: "",
    nationality: "",
    biography: "",
    gender: "",
    role: "actor" as
      | "actor"
      | "director"
      | "writer"
      | "producer"
      | "host"
      | "other",
    is_main_person: true,
    known_for_department: "",
    place_of_birth: "",
    tmdb_id: "",
    imdb_id: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoError, setPhotoError] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      if (formData.photo_url && !isValidUrl(formData.photo_url)) {
        throw new Error("URL da foto inválida");
      }

      const personData = {
        name: formData.name,
        photo_url: formData.photo_url || null,
        birth_date: formData.birth_date || null,
        death_date: formData.death_date || null,
        nationality: formData.nationality || null,
        biography: formData.biography || null,
        gender: formData.gender || null,
        role: formData.role,
        is_main_person: formData.is_main_person,
        known_for_department: formData.known_for_department || null,
        place_of_birth: formData.place_of_birth || null,
        tmdb_id: formData.tmdb_id || null,
        imdb_id: formData.imdb_id || null,
        user_id: user.id,
        also_known_as: null,
      };

      const { error } = await supabase.from("actors").insert([personData]);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      router.push("/people");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating person:", error);
      alert(
        `Erro ao criar pessoa: ${error.message || "Por favor, tente novamente."}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handlePhotoUrlChange = (url: string) => {
    setFormData({
      ...formData,
      photo_url: url,
    });

    if (url && isValidUrl(url)) {
      setPhotoPreview(url);
      setPhotoError("");
    } else if (url) {
      setPhotoError("URL inválida");
      setPhotoPreview("");
    } else {
      setPhotoPreview("");
      setPhotoError("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName="Utilizador" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="gap-2 mb-4">
              <Link href="/people">
                <ArrowLeft className="h-4 w-4" />
                Voltar à lista
              </Link>
            </Button>

            <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Adicionar Nova Pessoa
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados da nova pessoa para adicionar à sua coleção
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Coluna esquerda - Preview da foto */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      Pré-visualização
                    </CardTitle>
                    <CardDescription>
                      Sugestão: Use uma foto quadrada (1:1) para melhor
                      qualidade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Preview da foto */}
                      <div className="relative">
                        <div className="aspect-square rounded-lg overflow-hidden bg-linear-to-br from-primary/10 to-blue-500/10 border-2 border-dashed border-border/50 flex items-center justify-center">
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={() => {
                                setPhotoError(
                                  "Não foi possível carregar a imagem",
                                );
                                setPhotoPreview("");
                              }}
                            />
                          ) : (
                            <div className="text-center p-8">
                              <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                {formData.name ? (
                                  <div className="text-2xl font-bold text-primary">
                                    {getInitials(formData.name)}
                                  </div>
                                ) : (
                                  <ImageIcon className="h-12 w-12 text-primary/50" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formData.name
                                  ? `Preview de ${formData.name}`
                                  : "Adicione uma foto"}
                              </p>
                            </div>
                          )}
                        </div>

                        {photoError && (
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-red-500/10 text-red-500 text-xs text-center rounded-b-lg">
                            {photoError}
                          </div>
                        )}
                      </div>

                      {/* Informações de preview */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                            Detalhes da Foto
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Formato recomendado:
                              </span>
                              <span className="font-medium">
                                Quadrada (1:1)
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Tamanho recomendado:
                              </span>
                              <span className="font-medium">
                                500×500px ou maior
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Formatos suportados:
                              </span>
                              <span className="font-medium">
                                JPG, PNG, WebP
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status da pessoa */}
                        <div className="pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">
                                Pessoa Principal
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Aparece em destaque nas listas
                              </div>
                            </div>
                            <Switch
                              checked={formData.is_main_person}
                              onCheckedChange={(checked) =>
                                handleInputChange("is_main_person", checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna direita - Formulário */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="basic" className="mb-6">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                    <TabsTrigger value="details">
                      Detalhes Adicionais
                    </TabsTrigger>
                    <TabsTrigger value="external">IDs Externos</TabsTrigger>
                  </TabsList>

                  {/* Aba: Informações Básicas */}
                  <TabsContent value="basic">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>
                          Informações essenciais para identificar a pessoa
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="name"
                              className="flex items-center gap-2"
                            >
                              <User className="h-4 w-4" />
                              Nome Completo *
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                handleInputChange("name", e.target.value)
                              }
                              placeholder="Ex: Christopher Nolan"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="role"
                              className="flex items-center gap-2"
                            >
                              <Award className="h-4 w-4" />
                              Função Principal *
                            </Label>
                            <Select
                              value={formData.role}
                              onValueChange={(
                                value:
                                  | "actor"
                                  | "director"
                                  | "writer"
                                  | "producer"
                                  | "host"
                                  | "other",
                              ) => handleInputChange("role", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma função" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="actor">
                                  Ator/Atriz
                                </SelectItem>
                                <SelectItem value="director">
                                  Diretor(a)
                                </SelectItem>
                                <SelectItem value="writer">
                                  Escritor(a)
                                </SelectItem>
                                <SelectItem value="producer">
                                  Produtor(a)
                                </SelectItem>
                                <SelectItem value="host">
                                  Host/Apresentador(a)
                                </SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="photo_url"
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            URL da Foto
                          </Label>
                          <div className="relative">
                            <Input
                              id="photo_url"
                              value={formData.photo_url}
                              onChange={(e) =>
                                handlePhotoUrlChange(e.target.value)
                              }
                              placeholder="https://exemplo.com/foto.jpg"
                              type="url"
                            />
                            {formData.photo_url && (
                              <button
                                type="button"
                                onClick={() => handlePhotoUrlChange("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              >
                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Cole o URL de uma foto da pessoa (formatos: JPG,
                            PNG, WebP)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="biography"
                            className="flex items-center gap-2"
                          >
                            <span>📝</span>
                            Biografia
                          </Label>
                          <Textarea
                            id="biography"
                            value={formData.biography}
                            onChange={(e) =>
                              handleInputChange("biography", e.target.value)
                            }
                            placeholder="Descreva a biografia da pessoa..."
                            rows={6}
                            className="min-h-30"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Aba: Detalhes Adicionais */}
                  <TabsContent value="details">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Detalhes Adicionais</CardTitle>
                        <CardDescription>
                          Informações demográficas e pessoais
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="birth_date"
                              className="flex items-center gap-2"
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
                              max={new Date().toISOString().split("T")[0]}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="death_date"
                              className="flex items-center gap-2"
                            >
                              <Calendar className="h-4 w-4" />
                              Data de Falecimento
                            </Label>
                            <Input
                              id="death_date"
                              type="date"
                              value={formData.death_date}
                              onChange={(e) =>
                                handleInputChange("death_date", e.target.value)
                              }
                              max={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="gender"
                              className="flex items-center gap-2"
                            >
                              <User className="h-4 w-4" />
                              Género
                            </Label>
                            <Select
                              value={formData.gender}
                              onValueChange={(value) =>
                                handleInputChange("gender", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o género" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Masculino">
                                  Masculino
                                </SelectItem>
                                <SelectItem value="Feminino">
                                  Feminino
                                </SelectItem>
                                <SelectItem value="Não-binário">
                                  Não-binário
                                </SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                                <SelectItem value="Prefiro não dizer">
                                  Prefiro não dizer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="nationality"
                              className="flex items-center gap-2"
                            >
                              <Flag className="h-4 w-4" />
                              Nacionalidade
                            </Label>
                            <Input
                              id="nationality"
                              value={formData.nationality}
                              onChange={(e) =>
                                handleInputChange("nationality", e.target.value)
                              }
                              placeholder="Ex: Portuguesa"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="place_of_birth"
                            className="flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4" />
                            Local de Nascimento
                          </Label>
                          <Input
                            id="place_of_birth"
                            value={formData.place_of_birth}
                            onChange={(e) =>
                              handleInputChange(
                                "place_of_birth",
                                e.target.value,
                              )
                            }
                            placeholder="Ex: Lisboa, Portugal"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="known_for_department"
                            className="flex items-center gap-2"
                          >
                            <Award className="h-4 w-4" />
                            Departamento Principal
                          </Label>
                          <Input
                            id="known_for_department"
                            value={formData.known_for_department}
                            onChange={(e) =>
                              handleInputChange(
                                "known_for_department",
                                e.target.value,
                              )
                            }
                            placeholder="Ex: Acting, Directing, Production"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Aba: IDs Externos */}
                  <TabsContent value="external">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>IDs Externos</CardTitle>
                        <CardDescription>
                          IDs de bases de dados externas para sincronização
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="tmdb_id"
                            className="flex items-center gap-2"
                          >
                            <LinkIcon className="h-4 w-4" />
                            ID TMDB (The Movie Database)
                          </Label>
                          <Input
                            id="tmdb_id"
                            value={formData.tmdb_id}
                            onChange={(e) =>
                              handleInputChange("tmdb_id", e.target.value)
                            }
                            placeholder="Ex: 525"
                            type="number"
                          />
                          <p className="text-xs text-muted-foreground">
                            ID numérico da pessoa no TMDB
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="imdb_id"
                            className="flex items-center gap-2"
                          >
                            <LinkIcon className="h-4 w-4" />
                            ID IMDb
                          </Label>
                          <Input
                            id="imdb_id"
                            value={formData.imdb_id}
                            onChange={(e) =>
                              handleInputChange("imdb_id", e.target.value)
                            }
                            placeholder="Ex: nm0000138"
                          />
                          <p className="text-xs text-muted-foreground">
                            ID alfanumérico da pessoa no IMDb (começa com nm)
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Botões de ação */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/people">Cancelar</Link>
                  </Button>

                  <Button type="submit" disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? "A criar..." : "Criar Pessoa"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
