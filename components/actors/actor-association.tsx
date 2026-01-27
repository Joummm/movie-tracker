"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import {
  X,
  User,
  Plus,
  Briefcase,
  Search,
  Film,
  Loader2,
  Award,
} from "lucide-react";
import type { Actor, RoleType } from "@/lib/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContentActorAssociationProps {
  contentId?: string;
  seriesId?: string;
  userId: string;
  existingAssociations?: any[];
}

export function ContentActorAssociation({
  contentId,
  seriesId,
  userId,
  existingAssociations = [],
}: ContentActorAssociationProps) {
  const [actors, setActors] = useState<Actor[]>([]);
  const [filteredActors, setFilteredActors] = useState<Actor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActorId, setSelectedActorId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>(["actor"]);
  const [associations, setAssociations] = useState(existingAssociations);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewActorForm, setShowNewActorForm] = useState(false);
  const [newActorName, setNewActorName] = useState("");
  const [activeTab, setActiveTab] = useState("associate");

  useEffect(() => {
    loadActors();
    loadAssociations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = actors.filter((actor) =>
        actor.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredActors(filtered);
    } else {
      setFilteredActors(actors);
    }
  }, [searchTerm, actors]);

  const loadActors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("actors")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    setActors(data || []);
    setFilteredActors(data || []);
  };

  const loadAssociations = async () => {
    const supabase = createClient();
    const { data: newAssociations } = await supabase
      .from("content_actors")
      .select(
        `
        *,
        actor:actors(*),
        actor_roles(*)
      `,
      )
      .eq(contentId ? "content_id" : "series_id", contentId || seriesId)
      .order("created_at", { ascending: false });

    setAssociations(newAssociations || []);
  };

  const createNewActor = async () => {
    if (!newActorName.trim()) return;

    setIsLoading(true);
    const supabase = createClient();

    const { data: newActor, error } = await supabase
      .from("actors")
      .insert({
        user_id: userId,
        name: newActorName.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar ator:", error);
      alert("Erro ao criar ator: " + error.message);
      setIsLoading(false);
      return;
    }

    setActors((prev) => [...prev, newActor]);
    setSelectedActorId(newActor.id);
    setNewActorName("");
    setShowNewActorForm(false);
    setIsLoading(false);
  };

  const addAssociation = async () => {
    if (!selectedActorId) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      // Create content_actor association
      const { data: contentActor, error } = await supabase
        .from("content_actors")
        .insert({
          content_id: contentId || null,
          series_id: seriesId || null,
          actor_id: selectedActorId,
          role_name: roleName || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create actor roles
      const rolePromises = selectedRoles.map((role) =>
        supabase.from("actor_roles").insert({
          content_actor_id: contentActor.id,
          role,
          character_name: role === "actor" ? roleName : null,
        }),
      );

      await Promise.all(rolePromises);

      // Refresh data
      await loadAssociations();

      // Reset form
      setSelectedActorId("");
      setRoleName("");
      setSelectedRoles(["actor"]);
      setSearchTerm("");
      setActiveTab("view");
    } catch (error: any) {
      console.error("Erro ao associar ator:", error);
      alert("Erro ao associar ator: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeAssociation = async (associationId: string) => {
    if (!confirm("Tem certeza que deseja remover esta associação?")) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      // First delete actor roles
      await supabase
        .from("actor_roles")
        .delete()
        .eq("content_actor_id", associationId);

      // Then delete the content_actor association
      await supabase.from("content_actors").delete().eq("id", associationId);

      // Refresh associations
      await loadAssociations();
    } catch (error: any) {
      console.error("Erro ao remover associação:", error);
      alert("Erro ao remover associação: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (role: RoleType) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const getRoleLabel = (role: RoleType) => {
    const labels: Record<RoleType, string> = {
      actor: "Ator",
      director: "Realizador",
      writer: "Escritor",
      producer: "Produtor",
      composer: "Compositor",
      cinematographer: "Diretor de Fotografia",
    };
    return labels[role];
  };

  const getRoleIcon = (role: RoleType) => {
    const icons: Record<RoleType, React.ReactNode> = {
      actor: <User className="h-3 w-3" />,
      director: <Film className="h-3 w-3" />,
      writer: "✍️",
      producer: <Briefcase className="h-3 w-3" />,
      composer: "🎵",
      cinematographer: "🎥",
    };
    return icons[role];
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Elenco e Equipa Técnica</h3>
              <Badge variant="outline" className="text-xs">
                {associations.length}{" "}
                {associations.length === 1 ? "associação" : "associações"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Associe atores e membros da equipa técnica a este conteúdo
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="associate">
                <Plus className="h-4 w-4 mr-2" />
                Nova Associação
              </TabsTrigger>
              <TabsTrigger value="view">
                <User className="h-4 w-4 mr-2" />
                Visualizar ({associations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="associate" className="space-y-4 pt-4">
              {/* Search Section */}
              <div className="space-y-3">
                <Label htmlFor="actor-search" className="text-sm font-medium">
                  Procurar Ator
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="actor-search"
                      placeholder="Digite para procurar atores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewActorForm(true)}
                    disabled={showNewActorForm}
                    className="whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Ator
                  </Button>
                </div>
              </div>

              {/* New Actor Form */}
              {showNewActorForm && (
                <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Criar Novo Ator</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewActorForm(false);
                        setNewActorName("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-actor-name">Nome do Ator *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="new-actor-name"
                        value={newActorName}
                        onChange={(e) => setNewActorName(e.target.value)}
                        placeholder="Nome completo do ator"
                        className="flex-1"
                        onKeyDown={(e) => e.key === "Enter" && createNewActor()}
                      />
                      <Button
                        onClick={createNewActor}
                        disabled={isLoading || !newActorName.trim()}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          "Criar"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actor Selection Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="actor" className="text-sm font-medium">
                    Selecionar Ator *
                  </Label>
                  <Select
                    value={selectedActorId}
                    onValueChange={setSelectedActorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ator da lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredActors.length === 0 ? (
                        <div className="px-2 py-6 text-center">
                          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {searchTerm
                              ? "Nenhum ator encontrado"
                              : "Nenhum ator disponível"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setShowNewActorForm(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Criar novo ator
                          </Button>
                        </div>
                      ) : (
                        filteredActors.map((actor) => (
                          <SelectItem key={actor.id} value={actor.id}>
                            <div className="flex items-center gap-2">
                              {actor.photo_url ? (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={actor.photo_url}
                                    alt={actor.name}
                                  />
                                  <AvatarFallback>
                                    {actor.name?.charAt(0) || "A"}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-3 w-3" />
                                </div>
                              )}
                              <span>{actor.name || "Ator sem nome"}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleName" className="text-sm font-medium">
                    Personagem / Função
                  </Label>
                  <Input
                    id="roleName"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Ex: John Wick, Realizador Principal, etc."
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Funções *</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "actor",
                      "director",
                      "writer",
                      "producer",
                      "composer",
                      "cinematographer",
                    ] as RoleType[]
                  ).map((role) => (
                    <Badge
                      key={role}
                      variant={
                        selectedRoles.includes(role) ? "default" : "outline"
                      }
                      className="cursor-pointer gap-1.5 px-3 py-1.5"
                      onClick={() => toggleRole(role)}
                    >
                      {getRoleIcon(role)}
                      {getRoleLabel(role)}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedRoles.length === 0
                    ? "Selecione pelo menos uma função"
                    : `${selectedRoles.length} função(ões) selecionada(s)`}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  onClick={addAssociation}
                  disabled={
                    isLoading || !selectedActorId || selectedRoles.length === 0
                  }
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Associação
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="view" className="space-y-4 pt-4">
              {associations.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Associações Atuais</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("associate")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Associação
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {associations.map((association) => (
                      <div
                        key={association.id}
                        className="p-4 border rounded-lg hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage
                                src={association.actor?.photo_url}
                                alt={association.actor?.name}
                              />
                              <AvatarFallback className="bg-primary/10">
                                {association.actor?.name?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold truncate">
                                  {association.actor?.name ||
                                    "Ator desconhecido"}
                                </h5>
                                {association.actor?.nationality && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {association.actor.nationality}
                                  </Badge>
                                )}
                              </div>
                              {association.role_name && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  <span className="font-medium">Função:</span>{" "}
                                  {association.role_name}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {association.actor_roles?.map((role: any) => (
                                  <Badge
                                    key={role.id}
                                    variant="secondary"
                                    className="gap-1 px-2 py-1 text-xs"
                                  >
                                    {getRoleIcon(role.role)}
                                    {getRoleLabel(role.role)}
                                    {role.character_name && (
                                      <span className="ml-1">
                                        ({role.character_name})
                                      </span>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    removeAssociation(association.id)
                                  }
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover associação</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h4 className="font-medium mb-1">
                    Nenhuma associação encontrada
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione atores e membros da equipa a este conteúdo
                  </p>
                  <Button onClick={() => setActiveTab("associate")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Associação
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
