// components/series/series-cast.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Users, Award, Film, Search, Star, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface CastMember {
  id: string;
  actor_id: string;
  character_name: string;
  is_main_cast: boolean;
  episode_count?: number;
  season_range?: string;
  notes?: string;
  created_at: string;
  actors?: {
    id: string;
    name: string;
    photo_url?: string;
    role: string;
  };
}

interface SeriesCastProps {
  cast: CastMember[];
  seriesId: string;
}

export function SeriesCast({ cast, seriesId }: SeriesCastProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCast, setFilteredCast] = useState<CastMember[]>(cast);
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar lista filtrada quando o cast ou o termo de busca mudar
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCast(cast);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = cast.filter((member) => {
      const actorName = member.actors?.name?.toLowerCase() || "";
      const characterName = member.character_name?.toLowerCase() || "";
      return actorName.includes(term) || characterName.includes(term);
    });

    setFilteredCast(filtered);
  }, [searchTerm, cast]);

  const mainCast = filteredCast.filter((member) => member.is_main_cast);
  const guestCast = filteredCast.filter((member) => !member.is_main_cast);

  // Calcular estatísticas
  const totalActors = cast.length;
  const uniqueCharacters = new Set(cast.map((m) => m.character_name)).size;
  const averageEpisodes =
    cast.length > 0
      ? Math.round(
          cast.reduce((acc, m) => acc + (m.episode_count || 0), 0) /
            cast.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Atores</p>
                <p className="text-3xl font-bold">{totalActors}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Personagens Únicos
                </p>
                <p className="text-3xl font-bold">{uniqueCharacters}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Média de Episódios
                </p>
                <p className="text-3xl font-bold">{averageEpisodes}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar ator ou personagem..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Elenco
            </CardTitle>
            <CardDescription>
              {filteredCast.length === cast.length
                ? `${cast.length} atores no total`
                : `${filteredCast.length} de ${cast.length} atores encontrados`}
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href={`/series/${seriesId}/cast/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Elenco
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {cast.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum elenco adicionado ainda</p>
              <p className="text-sm mb-6">
                Adicione atores para construir o elenco desta série
              </p>
              <Button asChild>
                <Link href={`/series/${seriesId}/cast/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Elenco
                </Link>
              </Button>
            </div>
          ) : filteredCast.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum resultado encontrado</p>
              <p className="text-sm">
                Tente buscar por outro nome ou personagem
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchTerm("")}
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Main Cast */}
              {mainCast.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Elenco Principal
                      <Badge variant="secondary" className="ml-2">
                        {mainCast.length}
                      </Badge>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mainCast.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-4 rounded-xl border hover:bg-accent/50 transition-colors group"
                      >
                        <Avatar className="h-16 w-16 border-2 border-yellow-500/20 group-hover:border-yellow-500/40">
                          <AvatarImage
                            src={member.actors?.photo_url}
                            alt={member.actors?.name}
                          />
                          <AvatarFallback className="bg-yellow-500/10 text-yellow-700 font-bold">
                            {member.actors?.name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate text-lg">
                              {member.actors?.name}
                            </p>
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Principal
                            </Badge>
                          </div>
                          <p className="text-muted-foreground truncate">
                            como{" "}
                            <span className="font-medium">
                              {member.character_name}
                            </span>
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {member.episode_count && (
                              <span className="flex items-center gap-1">
                                <Film className="h-3 w-3" />
                                {member.episode_count} episódios
                              </span>
                            )}
                            {member.season_range && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {member.season_range}
                              </span>
                            )}
                          </div>
                          {member.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {member.notes}
                            </p>
                          )}
                        </div>
                        {member.actors?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Link href={`/people/${member.actors.id}`}>
                              Ver
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guest Cast */}
              {guestCast.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Film className="h-5 w-5 text-blue-500" />
                      Participações e Convidados
                      <Badge variant="outline" className="ml-2">
                        {guestCast.length}
                      </Badge>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guestCast.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={member.actors?.photo_url}
                            alt={member.actors?.name}
                          />
                          <AvatarFallback className="bg-blue-500/10 text-blue-600">
                            {member.actors?.name?.charAt(0) || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {member.actors?.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.character_name}
                          </p>
                          {member.episode_count && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {member.episode_count} ep
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo de Estatísticas */}
              <div className="pt-6 border-t">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {mainCast.length} atores principais</p>
                  <p>• {guestCast.length} atores convidados</p>
                  <p>• {uniqueCharacters} personagens únicos</p>
                  {averageEpisodes > 0 && (
                    <p>• Média de {averageEpisodes} episódios por ator</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
