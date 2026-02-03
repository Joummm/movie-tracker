"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Person, PersonCredit } from "@/lib/types/person";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Film,
  Tv,
  Mic,
  Zap,
  Clapperboard,
  Star,
  Calendar,
  MapPin,
  Edit,
  ArrowLeft,
  Award,
  Users,
  BookOpen,
  ExternalLink,
  Globe,
  Heart,
  Sparkles,
  Briefcase,
  Cake,
  Hash,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [credits, setCredits] = useState<PersonCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isFavorite, setIsFavorite] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      loadPerson();
      loadCredits();
    }
  }, [params.id]);

  const loadPerson = async () => {
    try {
      const { data, error } = await supabase
        .from("actors")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setPerson(data);
    } catch (error) {
      console.error("Error loading person:", error);
    }
  };

  const loadCredits = async () => {
    try {
      // Buscar produções da pessoa
      const { data: creditsData, error } = await supabase
        .from("content_actors")
        .select(
          `
          *,
          content:content_id (
            name,
            cover_image,
            type,
            content_subtype,
            release_year,
            rating
          )
        `,
        )
        .eq("actor_id", params.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedCredits: PersonCredit[] = (creditsData || []).map(
        (credit: any) => ({
          ...credit,
          content_name: credit.content?.name || null,
          content_cover_image: credit.content?.cover_image || null,
          content_type: credit.content?.type || null,
          content_subtype: credit.content?.content_subtype || null,
          release_year: credit.content?.release_year || null,
          rating: credit.content?.rating || null,
        }),
      );

      setCredits(formattedCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    } finally {
      setLoading(false);
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

  const getContentTypeIcon = (type?: string | null) => {
    switch (type) {
      case "movie":
        return <Film className="h-4 w-4" />;
      case "series":
        return <Tv className="h-4 w-4" />;
      case "short":
        return <Clapperboard className="h-4 w-4" />;
      case "podcast":
        return <Mic className="h-4 w-4" />;
      case "other":
        return <Zap className="h-4 w-4" />;
      default:
        return <Film className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type?: string | null) => {
    switch (type) {
      case "movie":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "series":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "short":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "podcast":
        return "text-purple-500 bg-purple-500/10 border-purple-500/20";
      case "other":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getContentUrl = (credit: PersonCredit) => {
    if (!credit.content_type || !credit.content_id) return "#";

    switch (credit.content_type) {
      case "movie":
        return `/movies/${credit.content_id}`;
      case "series":
        return `/series/${credit.content_id}`;
      case "short":
        return `/shorts/${credit.content_id}`;
      case "podcast":
        return `/podcasts/${credit.content_id}`;
      case "other":
        return `/outros/${credit.content_id}`;
      default:
        return "#";
    }
  };

  const calculateAge = (
    birthDate?: string | null,
    deathDate?: string | null,
  ) => {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredCredits = credits.filter((credit) => {
    if (activeTab === "all") return true;
    return credit.content_type === activeTab;
  });

  const creditsByType = {
    movie: credits.filter((c) => c.content_type === "movie").length,
    series: credits.filter((c) => c.content_type === "series").length,
    short: credits.filter((c) => c.content_type === "short").length,
    podcast: credits.filter((c) => c.content_type === "podcast").length,
    other: credits.filter((c) => c.content_type === "other").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-background to-background/80">
        <DashboardHeader userName="Utilizador" />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-muted rounded-lg"></div>
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-linear-to-b from-background to-background/80">
        <DashboardHeader userName="Utilizador" />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Pessoa não encontrada</h1>
          <Button asChild>
            <Link href="/people">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const age = calculateAge(person.birth_date, person.death_date);
  const totalCredits = credits.length;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName="Utilizador" />

      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho com navegação */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <Button variant="ghost" asChild className="gap-2 mb-2">
                <Link href="/people">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar à lista
                </Link>
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {person.name}
              </h1>
              {person.also_known_as && person.also_known_as.length > 0 && (
                <p className="text-muted-foreground mt-1">
                  Também conhecido como:{" "}
                  {person.also_known_as.slice(0, 3).join(", ")}
                  {person.also_known_as.length > 3 && "..."}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`rounded-full ${isFavorite ? "text-red-500 border-red-500/20 bg-red-500/10" : ""}`}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? "fill-red-500" : ""}`}
                />
              </Button>

              <Button
                asChild
                className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              >
                <Link href={`/people/${person.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna esquerda - Perfil */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card do perfil */}
            <Card className="border-border/50 shadow-lg overflow-hidden">
              <div className="p-6 bg-linear-to-br from-primary/5 to-blue-500/5">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute -inset-1 bg-linear-to-r from-primary to-blue-500 rounded-full blur opacity-30"></div>
                    {person.photo_url ? (
                      <Avatar className="h-48 w-48 border-4 border-background shadow-xl relative">
                        <AvatarImage src={person.photo_url} alt={person.name} />
                        <AvatarFallback className="text-3xl font-bold bg-linear-to-br from-primary to-blue-500 text-white">
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-48 w-48 rounded-full bg-linear-to-br from-primary to-blue-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-background shadow-xl">
                        {getInitials(person.name)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <Badge className="text-sm px-4 py-1.5 bg-linear-to-r from-primary to-blue-500 text-white border-none">
                      {person.role.charAt(0).toUpperCase() +
                        person.role.slice(1)}
                    </Badge>

                    {person.is_main_person && (
                      <Badge
                        variant="outline"
                        className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20"
                      >
                        <Sparkles className="h-3 w-3" />
                        Principal
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Informações pessoais */}
                <div className="space-y-4">
                  {(person.birth_date ||
                    person.nationality ||
                    person.gender) && (
                    <>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Informações Pessoais
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        {person.birth_date && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Cake className="h-4 w-4" />
                              Data de Nascimento
                            </div>
                            <div className="font-medium">
                              {formatDate(person.birth_date)}
                              {age && ` (${age} anos)`}
                            </div>
                          </div>
                        )}

                        {person.nationality && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Nacionalidade
                            </div>
                            <div className="font-medium">
                              {person.nationality}
                            </div>
                          </div>
                        )}

                        {person.gender && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Género
                            </div>
                            <div className="font-medium">{person.gender}</div>
                          </div>
                        )}

                        {person.place_of_birth && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Local de Nascimento
                            </div>
                            <div className="font-medium line-clamp-2">
                              {person.place_of_birth}
                            </div>
                          </div>
                        )}

                        {person.death_date && (
                          <div className="space-y-1 col-span-2">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Data de Falecimento
                            </div>
                            <div className="font-medium">
                              {formatDate(person.death_date)}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {person.known_for_department && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Departamento Principal
                        </div>
                        <div className="font-medium">
                          {person.known_for_department}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IDs externos */}
                  {(person.tmdb_id || person.imdb_id) && (
                    <div className="pt-4 border-t border-border/50">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                        IDs Externos
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {person.tmdb_id && (
                          <Badge variant="outline" className="gap-1">
                            <span className="text-emerald-500 font-medium">
                              TMDB
                            </span>
                            <span className="text-xs">{person.tmdb_id}</span>
                          </Badge>
                        )}

                        {person.imdb_id && (
                          <Badge variant="outline" className="gap-1">
                            <span className="text-yellow-500 font-medium">
                              IMDb
                            </span>
                            <span className="text-xs">{person.imdb_id}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-linear-to-br from-primary/5 to-blue-500/5">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Total de Produções
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {totalCredits}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {creditsByType.movie > 0 && (
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Film className="h-3 w-3" />
                          Filmes
                        </div>
                        <div className="font-bold text-emerald-500 text-xl">
                          {creditsByType.movie}
                        </div>
                      </div>
                    )}

                    {creditsByType.series > 0 && (
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Tv className="h-3 w-3" />
                          Séries
                        </div>
                        <div className="font-bold text-blue-500 text-xl">
                          {creditsByType.series}
                        </div>
                      </div>
                    )}

                    {creditsByType.short > 0 && (
                      <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clapperboard className="h-3 w-3" />
                          Curtas
                        </div>
                        <div className="font-bold text-orange-500 text-xl">
                          {creditsByType.short}
                        </div>
                      </div>
                    )}

                    {creditsByType.podcast > 0 && (
                      <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          Podcasts
                        </div>
                        <div className="font-bold text-purple-500 text-xl">
                          {creditsByType.podcast}
                        </div>
                      </div>
                    )}
                  </div>

                  {creditsByType.other > 0 && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Outros
                      </div>
                      <div className="font-bold text-amber-500 text-xl">
                        {creditsByType.other}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita - Biografia e Produções */}
          <div className="lg:col-span-2 space-y-6">
            {/* Biografia */}
            {person.biography && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Biografia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {person.biography}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Produções */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Produções
                    </CardTitle>
                    <CardDescription>
                      Todas as produções em que esta pessoa participou
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {totalCredits} produções
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {/* Tabs por tipo de conteúdo */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mb-6"
                >
                  <TabsList className="flex flex-wrap h-auto gap-2">
                    <TabsTrigger
                      value="all"
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Todos
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {credits.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="movie"
                      className="flex items-center gap-2"
                    >
                      <Film className="h-4 w-4" />
                      Filmes
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {creditsByType.movie}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="series"
                      className="flex items-center gap-2"
                    >
                      <Tv className="h-4 w-4" />
                      Séries
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {creditsByType.series}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="short"
                      className="flex items-center gap-2"
                    >
                      <Clapperboard className="h-4 w-4" />
                      Curtas
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {creditsByType.short}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="podcast"
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Podcasts
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {creditsByType.podcast}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="other"
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Outros
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {creditsByType.other}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Lista de produções */}
                {filteredCredits.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Film className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">
                      Nenhuma produção encontrada
                    </p>
                    <p className="text-sm">
                      {activeTab === "all"
                        ? "Esta pessoa ainda não tem produções registadas."
                        : `Esta pessoa não tem produções do tipo selecionado.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCredits.map((credit) => (
                      <div
                        key={credit.id}
                        className="group hover:bg-accent/50 transition-colors rounded-lg p-4 border border-transparent hover:border-border/50"
                      >
                        <div className="flex gap-4">
                          {/* Imagem do conteúdo */}
                          <div className="shrink-0">
                            <Link href={getContentUrl(credit)}>
                              <div className="w-20 h-28 rounded-lg overflow-hidden bg-linear-to-br from-primary/10 to-blue-500/10 flex items-center justify-center border border-border/50 group-hover:border-primary/30 transition-colors">
                                {credit.content_cover_image ? (
                                  <img
                                    src={credit.content_cover_image}
                                    alt={
                                      credit.content_name || "Conteúdo sem nome"
                                    }
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const fallback =
                                        e.currentTarget.parentElement?.querySelector(
                                          ".image-fallback",
                                        );
                                      if (fallback)
                                        fallback.classList.remove("hidden");
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`${credit.content_cover_image ? "hidden" : ""} image-fallback p-4 text-muted-foreground`}
                                >
                                  {getContentTypeIcon(credit.content_type)}
                                </div>
                              </div>
                            </Link>
                          </div>

                          {/* Informações produção*/}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                  <Link
                                    href={getContentUrl(credit)}
                                    className="flex items-center gap-2 hover:underline"
                                  >
                                    {credit.content_name || "Sem nome"}
                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </Link>
                                </h4>

                                {credit.character_name && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    como{" "}
                                    <span className="font-medium text-foreground">
                                      {credit.character_name}
                                    </span>
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                  <Badge
                                    className={getContentTypeColor(
                                      credit.content_type,
                                    )}
                                  >
                                    {getContentTypeIcon(credit.content_type)}
                                    <span className="ml-1">
                                      {credit.content_type === "movie" &&
                                        "Filme"}
                                      {credit.content_type === "series" &&
                                        "Série"}
                                      {credit.content_type === "short" &&
                                        "Curta"}
                                      {credit.content_type === "podcast" &&
                                        "Podcast"}
                                      {credit.content_type === "other" &&
                                        "Outro"}
                                    </span>
                                  </Badge>

                                  {credit.release_year && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {credit.release_year}
                                    </span>
                                  )}

                                  {credit.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-amber-500" />
                                      <span className="text-sm font-medium">
                                        {credit.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Informações adicionais */}
                              <div className="flex flex-col items-start sm:items-end gap-2">
                                {credit.is_main_cast && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs gap-1 bg-primary/5"
                                  >
                                    <Star className="h-3 w-3 text-primary" />
                                    Principal
                                  </Badge>
                                )}

                                <div className="flex flex-col items-end gap-1">
                                  {credit.credit_order && (
                                    <span className="text-xs text-muted-foreground">
                                      Ordem: #{credit.credit_order}
                                    </span>
                                  )}

                                  {credit.episode_count && (
                                    <span className="text-xs text-muted-foreground">
                                      {credit.episode_count} episódio
                                      {credit.episode_count !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Role original se diferente */}
                            {credit.original_role_name &&
                              credit.original_role_name !==
                                credit.character_name && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span className="font-medium">Original:</span>{" "}
                                  {credit.original_role_name}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              {filteredCredits.length > 0 && (
                <div className="border-t border-border/50 px-6 py-4 bg-linear-to-r from-card/50 to-card">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Mostrando {filteredCredits.length} produções
                    </span>
                    <span className="text-muted-foreground">
                      Última atualização:{" "}
                      {person.updated_at
                        ? formatDate(person.updated_at)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
