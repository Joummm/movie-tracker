"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ContentCard } from "@/components/content/content-card";
import {
  User,
  Calendar,
  Flag,
  Edit,
  ArrowLeft,
  Film,
  Tv,
  Award,
  Briefcase,
  Music,
  Mic,
} from "lucide-react";
import Image from "next/image";
import type { Actor, ContentWithSeries, Series } from "@/lib/types/database";

interface ActorDetailProps {
  actor: Actor;
  contentParticipations: any[];
  seriesParticipations: any[];
}

export function ActorDetail({
  actor,
  contentParticipations,
  seriesParticipations,
}: ActorDetailProps) {
  const router = useRouter();

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      male: "Masculino",
      female: "Feminino",
      non_binary: "Não-binário",
      other: "Outro",
    };
    return labels[gender] || gender;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      actor: "Ator",
      director: "Realizador",
      writer: "Escritor",
      producer: "Produtor",
      composer: "Compositor",
      cinematographer: "Diretor de Fotografia",
    };
    return labels[role] || role;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push("/actors")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar aos Atores
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Actor info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden bg-muted mb-4">
                  {actor.photo_url ? (
                    <Image
                      src={actor.photo_url}
                      alt={actor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <User className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{actor.name}</h1>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {actor.nationality && (
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      <span>{actor.nationality}</span>
                    </div>
                  )}

                  {actor.birth_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(actor.birth_date).toLocaleDateString("pt-PT")}
                        {actor.death_date &&
                          ` - ${new Date(actor.death_date).toLocaleDateString("pt-PT")}`}
                      </span>
                    </div>
                  )}

                  {actor.gender && (
                    <div className="capitalize">
                      {getGenderLabel(actor.gender)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {actor.biography && (
                <div>
                  <h3 className="font-semibold mb-2">Biografia</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {actor.biography}
                  </p>
                </div>
              )}

              {(actor.tmdb_id || actor.imdb_id) && (
                <div>
                  <h3 className="font-semibold mb-2">IDs Externos</h3>
                  <div className="space-y-1 text-sm">
                    {actor.tmdb_id && <p>TMDb: {actor.tmdb_id}</p>}
                    {actor.imdb_id && <p>IMDb: {actor.imdb_id}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={() => router.push(`/actors/edit/${actor.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Ator
          </Button>
        </div>

        {/* Right column - Participations */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">
                <Film className="h-4 w-4 mr-2" />
                Conteúdos ({contentParticipations.length})
              </TabsTrigger>
              <TabsTrigger value="series">
                <Tv className="h-4 w-4 mr-2" />
                Séries ({seriesParticipations.length})
              </TabsTrigger>
              <TabsTrigger value="stats">
                <Award className="h-4 w-4 mr-2" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {contentParticipations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma participação em conteúdos
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contentParticipations.map((participation) => (
                    <Card key={participation.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <h3 className="font-semibold text-lg mb-2">
                            {participation.content?.name || "Sem título"}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            {participation.actor_roles?.map((role: any) => (
                              <Badge key={role.id} variant="secondary">
                                {getRoleLabel(role.role)}
                              </Badge>
                            ))}
                          </div>
                          {participation.role_name && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Personagem: {participation.role_name}
                            </p>
                          )}
                        </div>

                        {participation.content && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              router.push(
                                `/content/${participation.content.id}`,
                              )
                            }
                          >
                            Ver Conteúdo
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="series" className="space-y-4">
              {seriesParticipations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma participação em séries
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {seriesParticipations.map((participation) => (
                    <Card key={participation.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <h3 className="font-semibold text-lg mb-2">
                            {participation.series?.name || "Série sem título"}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            {participation.actor_roles?.map((role: any) => (
                              <Badge key={role.id} variant="secondary">
                                {getRoleLabel(role.role)}
                              </Badge>
                            ))}
                          </div>
                          {participation.role_name && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Personagem: {participation.role_name}
                            </p>
                          )}
                        </div>

                        {participation.series && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              router.push(`/series/${participation.series.id}`)
                            }
                          >
                            Ver Série
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Ator</CardTitle>
                  <CardDescription>Resumo das participações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Total de Participações</h3>
                      <p className="text-3xl font-bold">
                        {contentParticipations.length +
                          seriesParticipations.length}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Funções</h3>
                      <div className="space-y-1">
                        {(() => {
                          const roles = new Set();
                          contentParticipations.forEach((p) =>
                            p.actor_roles?.forEach((r: any) =>
                              roles.add(r.role),
                            ),
                          );
                          seriesParticipations.forEach((p) =>
                            p.actor_roles?.forEach((r: any) =>
                              roles.add(r.role),
                            ),
                          );
                          return Array.from(roles).map((role: any) => (
                            <Badge key={role} className="mr-1">
                              {getRoleLabel(role)}
                            </Badge>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
