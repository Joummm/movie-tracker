// components/series/series-cast.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Award, Film } from "lucide-react";
import Link from "next/link";

interface CastMember {
  id: string;
  actor_id: string;
  character_name: string;
  is_main_cast: boolean;
  episode_count?: number;
  season_range?: string;
  actors?: {
    id: string;
    name: string;
    photo_url?: string;
    role: string;
  };
}

interface SeriesCastProps {
  cast: CastMember[];
}

export function SeriesCast({ cast }: SeriesCastProps) {
  const mainCast = cast.filter((member) => member.is_main_cast);
  const guestCast = cast.filter((member) => !member.is_main_cast);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Elenco</CardTitle>
        <Button size="sm" asChild>
          <Link href={`/series/${cast[0]?.id}/cast/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Ator
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {cast.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum ator adicionado ainda</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/series/${cast[0]?.id}/cast/new`}>
                Adicionar Primeiro Ator
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Cast */}
            {mainCast.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Elenco Principal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mainCast.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={member.actors?.photo_url}
                          alt={member.actors?.name}
                        />
                        <AvatarFallback>
                          {member.actors?.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            {member.actors?.name}
                          </p>
                          {member.is_main_cast && (
                            <Badge variant="secondary" className="text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          como {member.character_name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {member.episode_count && (
                            <span>{member.episode_count} episódios</span>
                          )}
                          {member.season_range && (
                            <span>{member.season_range}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="ml-auto"
                      >
                        <Link href={`/people/${member.actor_id}`}>Ver</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Cast */}
            {guestCast.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Participações
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guestCast.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={member.actors?.photo_url}
                          alt={member.actors?.name}
                        />
                        <AvatarFallback>
                          {member.actors?.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.actors?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.character_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
