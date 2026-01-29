// components/series/forms/new-cast-form.tsx
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
  UserPlus,
  User,
  Film,
  Award,
  Calendar,
  Hash,
  ArrowLeft,
  Save,
  X,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Person {
  id: string;
  name: string;
  photo_url?: string;
  role: string;
}

interface NewCastFormProps {
  userId: string;
  seriesId: string;
  seriesName: string;
  existingPersons: Person[];
}

export function NewCastForm({
  userId,
  seriesId,
  seriesName,
  existingPersons,
}: NewCastFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("select");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    // For existing person selection
    actor_id: "",
    // For new person creation
    new_person_name: "",
    new_person_photo_url: "",
    new_person_role: "actor" as "actor" | "director" | "producer",
    // Cast details
    character_name: "",
    is_main_cast: true,
    episode_count: "",
    season_range: "",
    notes: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.actor_id && !formData.new_person_name) {
      alert("Por favor, selecione um ator existente ou crie um novo.");
      return;
    }

    if (!formData.character_name.trim()) {
      alert("Por favor, insira o nome do personagem.");
      return;
    }

    setIsLoading(true);

    try {
      let actorId = formData.actor_id;

      // If creating new person
      if (!actorId && formData.new_person_name) {
        const newPersonData = {
          user_id: userId,
          name: formData.new_person_name,
          photo_url: formData.new_person_photo_url || null,
          role: formData.new_person_role,
          is_main_person: true,
        };

        const { data: newPerson, error: personError } = await supabase
          .from("actors")
          .insert([newPersonData])
          .select()
          .single();

        if (personError) throw personError;
        actorId = newPerson.id;
      }

      // Create cast entry
      const castData = {
        series_id: seriesId,
        actor_id: actorId,
        character_name: formData.character_name,
        is_main_cast: formData.is_main_cast,
        episode_count: formData.episode_count
          ? parseInt(formData.episode_count)
          : null,
        season_range: formData.season_range || null,
        notes: formData.notes || null,
      };

      const { data: newCast, error: castError } = await supabase
        .from("series_cast")
        .insert([castData])
        .select()
        .single();

      if (castError) throw castError;

      alert("Ator adicionado ao elenco com sucesso!");
      router.push(`/series/${seriesId}`);
    } catch (error: any) {
      console.error("Erro ao adicionar ator:", error);
      alert(`Erro ao adicionar ator: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter existing persons based on search
  const filteredPersons = existingPersons.filter(
    (person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            <h1 className="text-3xl font-bold tracking-tight">
              Adicionar ao Elenco
            </h1>
            <p className="text-muted-foreground">
              Adicione um ator ou membro da equipe à série "{seriesName}"
            </p>
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
            form="cast-form"
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </div>

      <form id="cast-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="select" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Selecionar Existente
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar Novo
                </TabsTrigger>
              </TabsList>

              {/* Select Existing Person Tab */}
              <TabsContent value="select" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Selecionar Pessoa Existente</CardTitle>
                    <CardDescription>
                      Escolha uma pessoa já cadastrada no seu banco de dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar por nome ou função..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Person List */}
                    {filteredPersons.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma pessoa encontrada</p>
                        <p className="text-sm mt-2">
                          {searchQuery
                            ? "Tente outra busca ou crie uma nova pessoa"
                            : "Crie sua primeira pessoa para adicionar ao elenco"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredPersons.map((person) => (
                          <div
                            key={person.id}
                            onClick={() =>
                              setFormData({ ...formData, actor_id: person.id })
                            }
                            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                              formData.actor_id === person.id
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {person.photo_url ? (
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                                  <img
                                    src={person.photo_url}
                                    alt={person.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold truncate">
                                  {person.name}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {person.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {person.photo_url
                                  ? "Foto disponível"
                                  : "Sem foto"}
                              </p>
                            </div>
                            {formData.actor_id === person.id && (
                              <div className="text-primary">
                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                  <div className="h-2 w-2 rounded-full bg-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Create New Person Tab */}
              <TabsContent value="create" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Criar Nova Pessoa</CardTitle>
                    <CardDescription>
                      Adicione uma nova pessoa ao seu banco de dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_person_name">
                        Nome da Pessoa <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new_person_name"
                        name="new_person_name"
                        value={formData.new_person_name}
                        onChange={handleInputChange}
                        placeholder="Nome completo da pessoa"
                        disabled={isLoading}
                        required={!formData.actor_id}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_person_photo_url">Foto (URL)</Label>
                      <Input
                        id="new_person_photo_url"
                        name="new_person_photo_url"
                        value={formData.new_person_photo_url}
                        onChange={handleInputChange}
                        placeholder="https://exemplo.com/foto.jpg"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_person_role">Função Principal</Label>
                      <Select
                        value={formData.new_person_role}
                        onValueChange={(
                          value: "actor" | "director" | "producer",
                        ) =>
                          setFormData({ ...formData, new_person_role: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="actor"
                            className="flex items-center gap-2"
                          >
                            <User className="h-4 w-4" />
                            Ator/Atriz
                          </SelectItem>
                          <SelectItem
                            value="director"
                            className="flex items-center gap-2"
                          >
                            <Film className="h-4 w-4" />
                            Diretor(a)
                          </SelectItem>
                          <SelectItem
                            value="producer"
                            className="flex items-center gap-2"
                          >
                            <Award className="h-4 w-4" />
                            Produtor(a)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Cast Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Participação</CardTitle>
                <CardDescription>
                  Informações sobre a participação na série
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="character_name"
                    className="flex items-center gap-2"
                  >
                    <Film className="h-4 w-4" />
                    Nome do Personagem <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="character_name"
                    name="character_name"
                    value={formData.character_name}
                    onChange={handleInputChange}
                    placeholder="Nome do personagem interpretado"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="episode_count"
                      className="flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4" />
                      Número de Episódios
                    </Label>
                    <Input
                      id="episode_count"
                      name="episode_count"
                      type="number"
                      min="0"
                      value={formData.episode_count}
                      onChange={handleInputChange}
                      placeholder="Ex: 10"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="season_range"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Temporadas
                    </Label>
                    <Input
                      id="season_range"
                      name="season_range"
                      value={formData.season_range}
                      onChange={handleInputChange}
                      placeholder="Ex: 1-3, 5"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Observações adicionais sobre a participação..."
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Label
                    htmlFor="is_main_cast"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    Elenco Principal
                  </Label>
                  <Switch
                    id="is_main_cast"
                    checked={formData.is_main_cast}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_main_cast: checked })
                    }
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Como a participação aparecerá</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {formData.actor_id ? (
                      existingPersons.find((p) => p.id === formData.actor_id)
                        ?.photo_url ? (
                        <img
                          src={
                            existingPersons.find(
                              (p) => p.id === formData.actor_id,
                            )?.photo_url
                          }
                          alt="Person preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground" />
                      )
                    ) : formData.new_person_photo_url ? (
                      <img
                        src={formData.new_person_photo_url}
                        alt="New person preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {formData.actor_id
                        ? existingPersons.find(
                            (p) => p.id === formData.actor_id,
                          )?.name
                        : formData.new_person_name || "Nome da Pessoa"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      como{" "}
                      <span className="font-medium">
                        {formData.character_name || "Personagem"}
                      </span>
                    </p>
                    {formData.is_main_cast && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Elenco Principal
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Função</span>
                    <span className="font-medium">
                      {formData.actor_id
                        ? existingPersons.find(
                            (p) => p.id === formData.actor_id,
                          )?.role
                        : formData.new_person_role}
                    </span>
                  </div>

                  {formData.episode_count && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Episódios</span>
                      <span className="font-medium">
                        {formData.episode_count}
                      </span>
                    </div>
                  )}

                  {formData.season_range && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Temporadas</span>
                      <span className="font-medium">
                        {formData.season_range}
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
                          Adicionando...
                        </div>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Adicionar ao Elenco
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

                  {/* CORREÇÃO AQUI: Substituir <p> com <div> */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Campos marcados com * são obrigatórios
                    </div>
                    <p>
                      Pessoas criadas aqui ficam disponíveis para outras séries
                      e conteúdos.
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
          <Button type="submit" disabled={isLoading} className="flex-1 gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
