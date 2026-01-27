"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { Actor, ContentActor } from "@/lib/types/database";

interface ActorsFormProps {
  contentId?: string;
  seriesId?: string;
  podcastId?: string;
  userId: string;
  existingActors?: ContentActor[];
}

export function ActorsForm({
  contentId,
  seriesId,
  podcastId,
  userId,
  existingActors = [],
}: ActorsFormProps) {
  const [actors, setActors] = useState<ContentActor[]>(existingActors);
  const [availableActors, setAvailableActors] = useState<Actor[]>([]);
  const [newActor, setNewActor] = useState({
    name: "",
    photo_url: "",
    role_name: "",
  });
  const [selectedActorId, setSelectedActorId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAvailableActors();
  }, []);

  const loadAvailableActors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("actors")
      .select("*")
      .eq("user_id", userId)
      .order("name");

    setAvailableActors(data || []);
  };

  const handleAddExistingActor = async () => {
    if (!selectedActorId) return;

    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("content_actors")
      .insert({
        content_id: contentId,
        series_id: seriesId,
        podcast_id: podcastId,
        actor_id: selectedActorId,
        role_name: newActor.role_name,
      })
      .select("*, actor(*)")
      .single();

    if (!error && data) {
      setActors([...actors, data]);
      setSelectedActorId("");
      setNewActor({ ...newActor, role_name: "" });
    }
    setIsLoading(false);
  };

  const handleCreateNewActor = async () => {
    if (!newActor.name) return;

    setIsLoading(true);
    const supabase = createClient();

    // First create the actor
    const { data: actorData, error: actorError } = await supabase
      .from("actors")
      .insert({
        user_id: userId,
        name: newActor.name,
        photo_url: newActor.photo_url || null,
      })
      .select()
      .single();

    if (actorError) {
      alert("Erro ao criar ator: " + actorError.message);
      setIsLoading(false);
      return;
    }

    // Then associate with content
    const { data: contentActorData, error: contentActorError } = await supabase
      .from("content_actors")
      .insert({
        content_id: contentId,
        series_id: seriesId,
        podcast_id: podcastId,
        actor_id: actorData.id,
        role_name: newActor.role_name,
      })
      .select("*, actor(*)")
      .single();

    if (!contentActorError && contentActorData) {
      setActors([...actors, contentActorData]);
      setAvailableActors([...availableActors, actorData]);
      setNewActor({ name: "", photo_url: "", role_name: "" });
    }
    setIsLoading(false);
  };

  const handleRemoveActor = async (actorId: string) => {
    setIsLoading(true);
    const supabase = createClient();

    await supabase.from("content_actors").delete().eq("id", actorId);

    setActors(actors.filter((actor) => actor.id !== actorId));
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Atores/Personagens</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Associe atores e seus personagens a este conteúdo
        </p>
      </div>

      {/* List of current actors */}
      {actors.length > 0 && (
        <div className="space-y-2">
          <Label>Atores Associados</Label>
          <div className="flex flex-wrap gap-2">
            {actors.map((actor) => (
              <Badge
                key={actor.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {actor.actor?.name}
                {actor.role_name && ` (${actor.role_name})`}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1"
                  onClick={() => handleRemoveActor(actor.id)}
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add existing actor */}
      <div className="space-y-2">
        <Label>Adicionar Ator Existente</Label>
        <div className="flex gap-2">
          <Select value={selectedActorId} onValueChange={setSelectedActorId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um ator" />
            </SelectTrigger>
            <SelectContent>
              {availableActors.map((actor) => (
                <SelectItem key={actor.id} value={actor.id}>
                  {actor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Nome do personagem (opcional)"
            value={newActor.role_name}
            onChange={(e) =>
              setNewActor({ ...newActor, role_name: e.target.value })
            }
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddExistingActor}
            disabled={!selectedActorId || isLoading}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create new actor */}
      <div className="space-y-2">
        <Label>Criar Novo Ator</Label>
        <div className="grid gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do ator *"
              value={newActor.name}
              onChange={(e) =>
                setNewActor({ ...newActor, name: e.target.value })
              }
              className="flex-1"
            />
            <Input
              placeholder="URL da foto (opcional)"
              value={newActor.photo_url}
              onChange={(e) =>
                setNewActor({ ...newActor, photo_url: e.target.value })
              }
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do personagem (opcional)"
              value={newActor.role_name}
              onChange={(e) =>
                setNewActor({ ...newActor, role_name: e.target.value })
              }
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleCreateNewActor}
              disabled={!newActor.name || isLoading}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar e Associar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
