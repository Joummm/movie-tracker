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
import { X, User, Plus, Briefcase, Search } from "lucide-react";
import type { Actor, RoleType } from "@/lib/types/database";

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

  useEffect(() => {
    loadActors();
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

  const createNewActor = async () => {
    if (!newActorName.trim()) return;

    setIsLoading(true);
    const supabase = createClient();

    const { data: newActor, error } = await supabase
      .from("actors")
      .insert({
        user_id: userId,
        name: newActorName,
      })
      .select()
      .single();

    if (error) {
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

    if (error) {
      alert("Erro ao associar ator: " + error.message);
      setIsLoading(false);
      return;
    }

    // Create actor roles
    for (const role of selectedRoles) {
      await supabase.from("actor_roles").insert({
        content_actor_id: contentActor.id,
        role,
        character_name: role === "actor" ? roleName : null,
      });
    }

    // Refresh associations
    const { data: newAssociations } = await supabase
      .from("content_actors")
      .select(
        `
        *,
        actor:actors(*),
        actor_roles(*)
      `,
      )
      .eq(contentId ? "content_id" : "series_id", contentId || seriesId);

    setAssociations(newAssociations || []);
    setSelectedActorId("");
    setRoleName("");
    setSelectedRoles(["actor"]);
    setIsLoading(false);
  };

  const removeAssociation = async (associationId: string) => {
    setIsLoading(true);
    const supabase = createClient();

    await supabase.from("content_actors").delete().eq("id", associationId);

    // Refresh associations
    const { data: newAssociations } = await supabase
      .from("content_actors")
      .select(
        `
        *,
        actor:actors(*),
        actor_roles(*)
      `,
      )
      .eq(contentId ? "content_id" : "series_id", contentId || seriesId);

    setAssociations(newAssociations || []);
    setIsLoading(false);
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Elenco e Equipa</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Associe atores e membros da equipa a este conteúdo
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="actor-search">Procurar Ator</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="actor-search"
                placeholder="Procurar ator..."
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
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Ator
            </Button>
          </div>
        </div>

        {showNewActorForm && (
          <div className="p-4 border rounded-lg space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-actor-name">Nome do Novo Ator</Label>
              <div className="flex gap-2">
                <Input
                  id="new-actor-name"
                  value={newActorName}
                  onChange={(e) => setNewActorName(e.target.value)}
                  placeholder="Nome do ator"
                  className="flex-1"
                />
                <Button
                  onClick={createNewActor}
                  disabled={isLoading || !newActorName.trim()}
                >
                  {isLoading ? "Criando..." : "Criar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewActorForm(false);
                    setNewActorName("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="actor">Selecionar Ator</Label>
            <Select value={selectedActorId} onValueChange={setSelectedActorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ator" />
              </SelectTrigger>
              <SelectContent>
                {filteredActors.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    {searchTerm
                      ? "Nenhum ator encontrado"
                      : "Nenhum ator disponível"}
                  </div>
                ) : (
                  filteredActors.map((actor) => (
                    <SelectItem key={actor.id} value={actor.id}>
                      {actor.name || "Ator sem nome"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleName">Personagem/Função</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="ex: John Wick, Realizador, etc."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Funções</Label>
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
                variant={selectedRoles.includes(role) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleRole(role)}
              >
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={addAssociation}
          disabled={isLoading || !selectedActorId || selectedRoles.length === 0}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {associations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Associações atuais</h4>
          <div className="space-y-2">
            {associations.map((association) => (
              <div
                key={association.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {association.actor?.name || "Ator desconhecido"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground ml-6 space-y-1">
                    {association.actor_roles?.map((role: any) => (
                      <div key={role.id} className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <Badge variant="secondary" className="text-xs">
                          {getRoleLabel(role.role)}
                          {role.character_name && `: ${role.character_name}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAssociation(association.id)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
