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
  Heart,
  Share2,
  Download,
  BarChart3,
  Star,
  Crown,
  TrendingUp,
  Clock,
  Users,
  Globe,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import type { Actor, ContentWithSeries, Series } from "@/lib/types/database";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      male: "Masculino",
      female: "Feminino",
      non_binary: "Não-binário",
      other: "Outro",
      not_specified: "Não especificado",
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

  // Calcular estatísticas
  const totalParticipations =
    contentParticipations.length + seriesParticipations.length;
  const uniqueRoles = new Set();
  contentParticipations.forEach((p) =>
    p.actor_roles?.forEach((r: any) => uniqueRoles.add(r.role)),
  );
  seriesParticipations.forEach((p) =>
    p.actor_roles?.forEach((r: any) => uniqueRoles.add(r.role)),
  );

  // Calcular anos de carreira
  const calculateCareerYears = () => {
    if (!actor.birth_date) return null;

    const birthDate = new Date(actor.birth_date);
    const endDate = actor.death_date ? new Date(actor.death_date) : new Date();

    let years = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < birthDate.getDate())
    ) {
      years--;
    }

    return years > 0 ? years : null;
  };

  const careerYears = calculateCareerYears();

  // Calcular idade atual ou à morte
  const calculateAge = () => {
    if (!actor.birth_date) return null;

    const birthDate = new Date(actor.birth_date);
    const endDate = actor.death_date ? new Date(actor.death_date) : new Date();

    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const age = calculateAge();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: actor.name,
          text: `Confira ${actor.name} no meu catálogo de atores`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Erro ao compartilhar:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header com navegação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/actors")}
          className="gap-2 self-start hover:bg-primary/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos Atores
        </Button>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={
                    isFavorite
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-600"
                      : ""
                  }
                >
                  <Heart className={isFavorite ? "fill-rose-500" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isFavorite
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Compartilhar ator</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => router.push(`/actors/edit/${actor.id}`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar Ator
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        {/* Left column - Actor info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-border/50 bg-linear-to-br from-background to-muted/5">
            <div className="relative h-64 bg-linear-to-br from-primary/10 to-secondary/10">
              {actor.photo_url ? (
                <Image
                  src={actor.photo_url}
                  alt={actor.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <User className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
              {/* Overlay gradiente */}
              <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
            </div>

            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center -mt-16 relative z-10">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background bg-background shadow-xl mb-4">
                  {actor.photo_url ? (
                    <Image
                      src={actor.photo_url}
                      alt={actor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {actor.name}
                </h1>

                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {actor.gender && (
                    <Badge variant="secondary" className="gap-1">
                      <User className="h-3 w-3" />
                      {getGenderLabel(actor.gender)}
                    </Badge>
                  )}
                  {actor.nationality && (
                    <Badge variant="outline" className="gap-1">
                      <Flag className="h-3 w-3" />
                      {actor.nationality}
                    </Badge>
                  )}
                  {age !== null && (
                    <Badge
                      variant={actor.death_date ? "destructive" : "default"}
                      className="gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      {age} anos {actor.death_date && "(†)"}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3 text-sm text-muted-foreground w-full max-w-xs">
                  {actor.birth_date && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <div className="text-center">
                        <div className="font-medium">Nascimento</div>
                        <div>
                          {new Date(actor.birth_date).toLocaleDateString(
                            "pt-PT",
                          )}
                        </div>
                        {actor.death_date && (
                          <>
                            <div className="font-medium mt-1">Falecimento</div>
                            <div>
                              {new Date(actor.death_date).toLocaleDateString(
                                "pt-PT",
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {totalParticipations > 0 && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Film className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-medium">Participações</div>
                        <div>{totalParticipations} no total</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biografia Card */}
          {actor.biography && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Biografia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {actor.biography}
                </p>
              </CardContent>
            </Card>
          )}

          {/* IDs Externos */}
          {(actor.tmdb_id || actor.imdb_id) && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">IDs Externos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {actor.tmdb_id && (
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">TMDb ID</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {actor.tmdb_id}
                    </code>
                  </div>
                )}
                {actor.imdb_id && (
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">IMDb ID</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {actor.imdb_id}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Participations */}
        <div className="lg:col-span-2">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total de Participações
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {totalParticipations}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Filmes</p>
                    <p className="text-3xl font-bold mt-2">
                      {contentParticipations.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-secondary/10">
                    <Film className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Séries</p>
                    <p className="text-3xl font-bold mt-2">
                      {seriesParticipations.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-amber-500/10">
                    <Tv className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Film className="h-4 w-4 mr-2" />
                Filmes ({contentParticipations.length})
              </TabsTrigger>
              <TabsTrigger
                value="series"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Tv className="h-4 w-4 mr-2" />
                Séries ({seriesParticipations.length})
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Award className="h-4 w-4 mr-2" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {contentParticipations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Film className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      Nenhuma participação em filmes
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Este ator ainda não tem filmes associados. Adicione
                      participações para ver detalhes aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contentParticipations.map((participation) => (
                    <Card
                      key={participation.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 group"
                      onClick={() =>
                        participation.content &&
                        router.push(`/content/${participation.content.id}`)
                      }
                    >
                      <CardContent className="p-0">
                        <div className="p-5">
                          <div className="mb-4">
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {participation.content?.name || "Sem título"}
                            </h3>
                            {participation.content?.release_year && (
                              <div className="flex items-center text-sm text-muted-foreground mb-3">
                                <Calendar className="h-3 w-3 mr-1" />
                                {participation.content.release_year}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {participation.actor_roles?.map((role: any) => (
                                <Badge
                                  key={role.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {getRoleLabel(role.role)}
                                </Badge>
                              ))}
                            </div>
                            {participation.role_name && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Personagem:</span>{" "}
                                {participation.role_name}
                              </p>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="p-4 bg-muted/30">
                          {participation.content && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full group-hover:bg-primary/10 transition-colors"
                            >
                              Ver Detalhes do Filme
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="series" className="space-y-6">
              {seriesParticipations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Tv className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      Nenhuma participação em séries
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Este ator ainda não tem séries associadas. Adicione
                      participações para ver detalhes aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {seriesParticipations.map((participation) => (
                    <Card
                      key={participation.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 group"
                      onClick={() =>
                        participation.series &&
                        router.push(`/series/${participation.series.id}`)
                      }
                    >
                      <CardContent className="p-0">
                        <div className="p-5">
                          <div className="mb-4">
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-secondary transition-colors line-clamp-2">
                              {participation.series?.name || "Série sem título"}
                            </h3>
                            {participation.series?.release_year && (
                              <div className="flex items-center text-sm text-muted-foreground mb-3">
                                <Calendar className="h-3 w-3 mr-1" />
                                {participation.series.release_year}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {participation.actor_roles?.map((role: any) => (
                                <Badge
                                  key={role.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {getRoleLabel(role.role)}
                                </Badge>
                              ))}
                            </div>
                            {participation.role_name && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Personagem:</span>{" "}
                                {participation.role_name}
                              </p>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="p-4 bg-muted/30">
                          {participation.series && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full group-hover:bg-secondary/10 transition-colors"
                            >
                              Ver Detalhes da Série
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Estatísticas Detalhadas</CardTitle>
                  <CardDescription>
                    Análise completa das participações do ator
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Resumo
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span>Total de Participações</span>
                          <Badge
                            variant="default"
                            className="text-lg px-3 py-1"
                          >
                            {totalParticipations}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span>Filmes</span>
                          <Badge
                            variant="secondary"
                            className="text-lg px-3 py-1"
                          >
                            {contentParticipations.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span>Séries</span>
                          <Badge
                            variant="outline"
                            className="text-lg px-3 py-1"
                          >
                            {seriesParticipations.length}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Funções Exercidas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(uniqueRoles).map((role: any) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className="text-sm py-2 px-3"
                          >
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                      {uniqueRoles.size === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma função específica registrada
                        </p>
                      )}
                    </div>
                  </div>

                  {careerYears && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Linha do Tempo da Carreira
                      </h3>
                      <div className="p-4 bg-linear-to-r from-primary/5 to-secondary/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Início da Carreira
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {actor.birth_date &&
                              new Date(actor.birth_date).getFullYear()}
                          </span>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-linear-to-r from-primary to-secondary rounded-full"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium">
                            {actor.death_date ? "Fim da Carreira" : "Presente"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {actor.death_date
                              ? new Date(actor.death_date).getFullYear()
                              : new Date().getFullYear()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
