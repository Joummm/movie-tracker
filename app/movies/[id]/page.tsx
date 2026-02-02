// app/movies/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Star,
  Clock,
  Calendar,
  Film,
  Edit,
  Play,
  Plus,
  Users,
  Award,
  Quote,
  Eye,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Repeat,
  CalendarDays,
  Layers,
  BarChart3,
  BookOpen,
  PenTool,
  ThumbsUp,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Defina os tipos localmente
type WatchStatus =
  | "completed"
  | "watching"
  | "planned"
  | "rewatching"
  | "abandoned";

const statusColors: Record<WatchStatus, string> = {
  completed: "bg-emerald-500",
  watching: "bg-blue-500",
  planned: "bg-amber-500",
  rewatching: "bg-purple-500",
  abandoned: "bg-rose-500",
};

const statusLabels: Record<WatchStatus, string> = {
  completed: "Assistido",
  watching: "Assistindo",
  planned: "Planejado",
  rewatching: "Reassistindo",
  abandoned: "Abandonado",
};

async function fetchMovieData(movieId: string, userId: string) {
  const supabase = await createClient();

  // Buscar filme
  const { data: movie, error: movieError } = await supabase
    .from("content")
    .select("*")
    .eq("id", movieId)
    .eq("user_id", userId)
    .eq("type", "movie")
    .single();

  if (!movie) {
    console.log("Filme não encontrado ou erro:", movieError);
    return null;
  }

  // Buscar dados relacionados
  const [
    { data: actors },
    { data: crew },
    { data: genres },
    { data: viewings },
  ] = await Promise.all([
    supabase
      .from("content_actors")
      .select("*, actor:actors(*)")
      .eq("content_id", movieId)
      .order("credit_order", { ascending: true }),
    supabase
      .from("content_crew")
      .select("*, person:actors(*)")
      .eq("content_id", movieId),
    supabase
      .from("content_genres")
      .select("*, genre:genres(*)")
      .eq("content_id", movieId),
    supabase
      .from("content_viewings")
      .select("*")
      .eq("content_id", movieId)
      .order("watched_date", { ascending: false }),
  ]);

  // Buscar filmes relacionados (mesmo ano, ou filmes recentes)
  const { data: relatedMovies } = await supabase
    .from("content")
    .select("id, name, cover_image, release_year, rating, duration")
    .eq("user_id", userId)
    .eq("type", "movie")
    .neq("id", movieId)
    .order("created_at", { ascending: false })
    .limit(4);

  // Calcular estatísticas
  const watchCount = viewings?.length || (movie.watched_date ? 1 : 0);
  const totalWatchTime = (movie.duration || 0) * watchCount;
  const rewatchCount = Math.max(0, watchCount - 1);

  const watchDates = viewings?.map((v) => v.watched_date).filter(Boolean) || [];
  if (movie.watched_date) watchDates.push(movie.watched_date);

  const sortedDates = watchDates.sort();
  const firstWatched = sortedDates[0];
  const lastWatched = sortedDates[sortedDates.length - 1];

  let daysSinceLastWatch: number | undefined;
  if (lastWatched) {
    const lastWatchedDate = new Date(lastWatched);
    const today = new Date();
    daysSinceLastWatch = Math.floor(
      (today.getTime() - lastWatchedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return {
    movie,
    details: {
      actors: actors || [],
      crew: crew || [],
      genres: genres || [],
      viewings: viewings || [],
      relatedMovies: relatedMovies || [],
    },
    stats: {
      watch_count: watchCount,
      total_watch_time: totalWatchTime,
      average_rating: movie.rating || 0,
      rewatch_count: rewatchCount,
      first_watched: firstWatched,
      last_watched: lastWatched,
      days_since_last_watch: daysSinceLastWatch,
    },
  };
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validação do ID
  if (!id || id === "undefined" || id === "null") {
    redirect("/movies");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch movie data
  const movieData = await fetchMovieData(id, user.id);

  if (!movieData) {
    notFound();
  }

  const { movie, details, stats } = movieData;

  // Formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Render stars for rating
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-6 w-6 ${
                i < fullStars
                  ? "text-yellow-500 fill-yellow-500"
                  : i === fullStars && hasHalfStar
                    ? "text-yellow-500 fill-yellow-500/50"
                    : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="font-bold text-2xl">
          {rating.toFixed(1)}
          <span className="text-lg text-muted-foreground">/10</span>
        </span>
      </div>
    );
  };

  // Obter status de forma segura
  const movieStatus = movie.watch_status as WatchStatus;
  const statusColor = statusColors[movieStatus] || "bg-gray-500";
  const statusLabel = statusLabels[movieStatus] || "Desconhecido";

  // Calcular porcentagem para barras de progresso
  const ratingPercentage = movie.rating ? (movie.rating / 10) * 100 : 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/95">
      <DashboardHeader userName={profile?.display_name || "User"} />

      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient */}
        {movie.cover_image && (
          <div className="absolute inset-0 h-125 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
              style={{
                backgroundImage: `url(${movie.cover_image})`,
                filter: "blur(40px) brightness(0.3)",
              }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-background via-background/90 to-background" />
          </div>
        )}

        <main className="container relative mx-auto px-4 md:px-6 lg:px-8 py-8">
          {/* Breadcrumb e Ações */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <Link href="/movies">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Voltar para filmes</span>
                  <span className="sm:hidden">Voltar</span>
                </Link>
              </Button>
              <div className="h-4 w-px bg-border/50" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Meus Filmes</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground truncate max-w-50">
                  {movie.name || "Filme sem nome"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link href={`/movies/${movie.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
              </Button>

              <Button
                size="sm"
                className="gap-2 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              >
                <Play className="h-4 w-4" />
                Marcar como assistido
              </Button>
            </div>
          </div>

          {/* Header Principal do Filme */}
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            {/* Poster */}
            <div className="lg:w-2/5 xl:w-1/3">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-linear-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Poster principal */}
                <div className="relative aspect-2/3 rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50 bg-linear-to-br from-card to-card/50">
                  {movie.cover_image ? (
                    <img
                      src={movie.cover_image}
                      alt={movie.name || "Filme"}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-muted to-muted/50">
                      <Film className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                  {/* Status badge */}
                  <div className="absolute top-4 left-4">
                    <Badge
                      className={`gap-2 px-3 py-1.5 ${statusColor} text-white border-0`}
                    >
                      <div className="h-2 w-2 rounded-full bg-white" />
                      <span className="font-semibold">{statusLabel}</span>
                    </Badge>
                  </div>

                  {/* Rating overlay */}
                  {movie.rating && movie.rating > 0 && (
                    <div className="absolute bottom-4 right-4">
                      <div className="relative bg-background/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-yellow-500/20">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <div className="flex flex-col">
                            <span className="font-bold text-2xl leading-none">
                              {movie.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /10
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informações do Filme */}
            <div className="lg:w-3/5 xl:w-2/3 space-y-8">
              {/* Título e Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <Badge
                    variant="outline"
                    className="mb-3 px-3 py-1 text-sm font-medium border-primary/20 text-primary"
                  >
                    <Film className="h-3 w-3 mr-1" />
                    FILME
                  </Badge>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                    {movie.name || "Filme sem nome"}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    {movie.release_year && (
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {movie.release_year}
                        </span>
                      </span>
                    )}

                    {movie.duration && (
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {movie.duration} minutos
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating Stars */}
                {movie.rating && movie.rating > 0 && (
                  <div className="flex items-center gap-4">
                    {renderStars(movie.rating)}
                    <span className="text-sm text-muted-foreground">
                      {movie.rating >= 8.5
                        ? "Excelente"
                        : movie.rating >= 7
                          ? "Bom"
                          : movie.rating >= 5
                            ? "Regular"
                            : "Ruim"}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-border/50 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Eye className="h-5 w-5 text-emerald-500" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Visualizações
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold mb-2">
                      {stats.watch_count}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vezes assistido
                    </p>
                    <Progress
                      value={
                        (stats.watch_count / Math.max(stats.watch_count, 10)) *
                        100
                      }
                      className="mt-3"
                    />
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Tempo Total
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold mb-2">
                      {Math.round(stats.total_watch_time / 60)}h
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Horas de entretenimento
                    </p>
                    <Progress
                      value={
                        (stats.total_watch_time / (movie.duration || 1 * 10)) *
                        100
                      }
                      className="mt-3"
                    />
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Repeat className="h-5 w-5 text-purple-500" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Reassistido
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold mb-2">
                      {stats.rewatch_count}x
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vale a pena rever
                    </p>
                    <Progress
                      value={Math.min(stats.rewatch_count * 20, 100)}
                      className="mt-3"
                    />
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <CalendarDays className="h-5 w-5 text-amber-500" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Última vez
                      </Badge>
                    </div>
                    <p className="text-xl font-bold mb-2">
                      {stats.last_watched
                        ? formatDate(stats.last_watched)
                        : "Nunca"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stats.days_since_last_watch
                        ? `${stats.days_since_last_watch} dias atrás`
                        : "Primeira vez"}
                    </p>
                    <Progress
                      value={
                        stats.days_since_last_watch
                          ? Math.min(
                              (stats.days_since_last_watch / 365) * 100,
                              100,
                            )
                          : 0
                      }
                      className="mt-3"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Ações Rápidas */}
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2 px-6" size="lg">
                  <Play className="h-4 w-4" />
                  Marcar como assistido
                </Button>

                <Button variant="outline" size="lg" className="gap-2 px-6">
                  <Heart className="h-4 w-4" />
                  Favoritar
                </Button>

                <Button variant="outline" size="lg" className="gap-2 px-6">
                  <Plus className="h-4 w-4" />
                  Adicionar à lista
                </Button>

                <Button variant="outline" size="lg" className="gap-2 px-6">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              {/* Gêneros */}
              {details.genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                    Gêneros
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.genres.map((genreItem: any, index: number) => (
                      <Badge
                        key={genreItem.id}
                        variant="secondary"
                        className="px-3 py-1.5 rounded-lg gap-2"
                      >
                        {genreItem.genre?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 p-1 bg-background border rounded-2xl">
              <TabsTrigger value="overview" className="rounded-xl">
                <Sparkles className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="cast" className="rounded-xl">
                <Users className="h-4 w-4 mr-2" />
                Elenco & Equipe
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl">
                <Calendar className="h-4 w-4 mr-2" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="related" className="rounded-xl">
                <Layers className="h-4 w-4 mr-2" />
                Relacionados
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-xl">
                <BarChart3 className="h-4 w-4 mr-2" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Sinopse e Informações */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Sinopse e Resenha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {movie.review ? (
                      <div className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {movie.review}
                        </p>
                        {movie.notes && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <PenTool className="h-4 w-4" />
                                Notas Pessoais
                              </h4>
                              <p className="text-muted-foreground">
                                {movie.notes}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Quote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Nenhuma resenha adicionada para este filme.
                        </p>
                        <Button variant="outline" className="mt-4" asChild>
                          <Link href={`/movies/${movie.id}/edit`}>
                            <PenTool className="h-4 w-4 mr-2" />
                            Adicionar Resenha
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações Adicionais */}
                <div className="space-y-6">
                  {/* Recomendações Pessoais */}
                  {(movie.would_recommend || movie.would_rewatch) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ThumbsUp className="h-5 w-5 text-emerald-500" />
                          Suas Recomendações
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {movie.would_recommend && (
                          <div className="flex items-center gap-3 p-3 rounded-lg border border-white-200">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            <div>
                              <p className="font-medium">Recomendaria</p>
                              <p className="text-sm text-muted-foreground">
                                Para outros espectadores
                              </p>
                            </div>
                          </div>
                        )}

                        {movie.would_rewatch && (
                          <div className="flex items-center gap-3 p-3 rounded-lg border border-white-200">
                            <Repeat className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">Reassistiria</p>
                              <p className="text-sm text-muted-foreground">
                                Vale a pena rever
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cast" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Elenco Completo */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Elenco Completo
                    </CardTitle>
                    <CardDescription>
                      {details.actors.length} atores no total
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {details.actors.map((actorItem: any) => (
                        <div
                          key={actorItem.id}
                          className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-14 w-14">
                            {actorItem.actor?.photo_url ? (
                              <AvatarImage
                                src={actorItem.actor.photo_url}
                                alt={actorItem.actor.name}
                              />
                            ) : null}
                            <AvatarFallback>
                              {actorItem.actor?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">
                              {actorItem.actor?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {actorItem.character_name ||
                                actorItem.original_role_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {actorItem.is_main_cast && (
                                <Badge variant="default" className="text-xs">
                                  Principal
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {details.actors.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum ator adicionado
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Equipe Técnica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      Equipe Técnica
                    </CardTitle>
                    <CardDescription>
                      {details.crew.length} membros da equipe
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {details.crew.slice(0, 8).map((crewItem: any) => (
                      <div
                        key={crewItem.id}
                        className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-14 w-14">
                          {crewItem.person?.photo_url ? (
                            <AvatarImage
                              src={crewItem.person.photo_url}
                              alt={crewItem.person.name}
                            />
                          ) : null}
                          <AvatarFallback>
                            {crewItem.person?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {crewItem.person?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {crewItem.role}
                            </Badge>
                            {crewItem.job_title && (
                              <span className="text-sm text-muted-foreground truncate">
                                {crewItem.job_title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {details.crew.length === 0 && (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum membro da equipe adicionado
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Histórico de Visualização
                  </CardTitle>
                  <CardDescription>
                    {details.viewings.length + (movie.watched_date ? 1 : 0)}{" "}
                    registros no total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Primeira visualização */}
                    {movie.watched_date && (
                      <div className="flex items-center justify-between p-6 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              Primeira Visualização
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(movie.watched_date)}
                            </p>
                          </div>
                        </div>
                        {movie.rating && (
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-lg">
                              {movie.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Visualizações subsequentes */}
                    {details.viewings.map((viewing: any) => (
                      <div
                        key={viewing.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {formatDate(viewing.watched_date)}
                          </p>
                          {viewing.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {viewing.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {viewing.rating && (
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">
                                {viewing.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {details.viewings.length === 0 && !movie.watched_date && (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Ainda não assistido
                        </p>
                        <Button className="mt-4">
                          <Play className="h-4 w-4 mr-2" />
                          Marcar como Assistido
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="related" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Filmes Relacionados
                  </CardTitle>
                  <CardDescription>
                    Outros filmes da sua coleção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {details.relatedMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {details.relatedMovies.map((relatedMovie: any) => (
                        <Link
                          key={relatedMovie.id}
                          href={`/movies/${relatedMovie.id}`}
                          className="group block"
                        >
                          <Card className="overflow-hidden border hover:shadow-lg transition-all duration-300">
                            <div className="relative aspect-2/3 overflow-hidden">
                              {relatedMovie.cover_image ? (
                                <img
                                  src={relatedMovie.cover_image}
                                  alt={relatedMovie.name}
                                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="h-full w-full bg-muted flex items-center justify-center">
                                  <Film className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            <CardContent className="p-4">
                              <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                {relatedMovie.name}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="text-sm text-muted-foreground">
                                  {relatedMovie.release_year}
                                </div>
                                {relatedMovie.rating &&
                                  relatedMovie.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                      <span className="text-sm font-medium">
                                        {relatedMovie.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum filme relacionado encontrado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Estatísticas de Visualização */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Estatísticas de Visualização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total de Visualizações
                        </span>
                        <span className="font-bold text-2xl">
                          {stats.watch_count}x
                        </span>
                      </div>
                      <Progress
                        value={
                          (stats.watch_count /
                            Math.max(stats.watch_count, 10)) *
                          100
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Horas Assistidas
                        </span>
                        <span className="font-bold text-2xl">
                          {Math.round(stats.total_watch_time / 60)}h
                        </span>
                      </div>
                      <Progress
                        value={
                          (stats.total_watch_time /
                            (movie.duration || 1 * 10)) *
                          100
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Taxa de Reassistir
                        </span>
                        <span className="font-bold text-2xl">
                          {stats.rewatch_count}x
                        </span>
                      </div>
                      <Progress
                        value={Math.min(stats.rewatch_count * 20, 100)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Informações de Tempo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-emerald-500" />
                      Linha do Tempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {stats.first_watched && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Primeira Visualização
                          </span>
                          <span className="font-medium">
                            {formatDate(stats.first_watched)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-1/4" />
                        </div>
                      </div>
                    )}

                    {stats.last_watched && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Última Visualização
                          </span>
                          <span className="font-medium">
                            {formatDate(stats.last_watched)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full w-3/4" />
                        </div>
                      </div>
                    )}

                    {stats.days_since_last_watch && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Dias desde a última
                          </span>
                          <span className="font-medium">
                            {stats.days_since_last_watch} dias
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${Math.min((stats.days_since_last_watch / 365) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Filme adicionado em{" "}
              {new Date(movie.created_at).toLocaleDateString("pt-BR")} • Última
              atualização em{" "}
              {new Date(movie.updated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
