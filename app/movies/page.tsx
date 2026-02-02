// app/movies/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Film,
  Plus,
  Calendar,
  Clock,
  Star,
  Film as FilmIcon,
} from "lucide-react";
import Link from "next/link";
import { MovieFilters } from "@/lib/types/movies";
import { Badge } from "@/components/ui/badge";
import { MoviesList } from "@/components/movies/MovieList";
import { WatchStatus } from "@/lib/types/database";

// Componente para estatísticas
function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  progress,
}: any) {
  return (
    <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}/10`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <Badge variant="outline" className="text-xs">
          {title}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {progress !== undefined && (
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full bg-linear-to-r ${color} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}
    </div>
  );
}

// Função para buscar dados dos filmes
async function fetchMoviesData(userId: string, filters?: MovieFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("content")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "movie");

  // Aplicar filtros
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters?.year) {
    query = query.eq("release_year", filters.year);
  }

  if (filters?.watch_status) {
    query = query.eq("watch_status", filters.watch_status);
  }

  // Ordenação
  if (filters?.sort_by) {
    switch (filters.sort_by) {
      case "recent":
        query = query.order("created_at", { ascending: false });
        break;
      case "rating":
        query = query.order("rating", {
          ascending: filters.sort_order === "asc",
        });
        break;
      case "name":
        query = query.order("name", {
          ascending: filters.sort_order === "asc",
        });
        break;
      case "year":
        query = query.order("release_year", {
          ascending: filters.sort_order === "asc",
        });
        break;
      case "duration":
        query = query.order("duration", {
          ascending: filters.sort_order === "asc",
        });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: movies } = await query;

  // Para cada filme, buscar estatísticas adicionais
  const moviesWithStats = await Promise.all(
    (movies || []).map(async (movie) => {
      // Buscar viewings (reassistidas)
      const { data: viewings } = await supabase
        .from("content_viewings")
        .select("*")
        .eq("content_id", movie.id)
        .order("watched_date", { ascending: false });

      // Buscar atores
      const { data: actors } = await supabase
        .from("content_actors")
        .select("*, actor:actors(*)")
        .eq("content_id", movie.id)
        .order("credit_order", { ascending: true });

      // Buscar gêneros
      const { data: genres } = await supabase
        .from("content_genres")
        .select("*, genre:genres(*)")
        .eq("content_id", movie.id);

      // Calcular estatísticas
      const watchCount = viewings?.length || (movie.watched_date ? 1 : 0);
      const totalWatchTime = (movie.duration || 0) * watchCount;
      const averageRating = movie.rating || 0;
      const rewatchCount = Math.max(0, watchCount - 1);

      const watchDates =
        viewings?.map((v) => v.watched_date).filter(Boolean) || [];
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
        ...movie,
        stats: {
          watch_count: watchCount,
          total_watch_time: totalWatchTime,
          average_rating: averageRating,
          rewatch_count: rewatchCount,
          first_watched: firstWatched,
          last_watched: lastWatched,
          days_since_last_watch: daysSinceLastWatch,
        },
        actors: actors || [],
        genres: genres || [],
        viewings: viewings || [],
      };
    }),
  );

  return moviesWithStats;
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  // IMPORTANTE: Em Next.js 15, searchParams é uma Promise
  const resolvedSearchParams = await searchParams;

  // Parse search params - CORREÇÃO: searchParams agora é um objeto regular
  const filters: MovieFilters = {};

  if (resolvedSearchParams.search) {
    filters.search = Array.isArray(resolvedSearchParams.search)
      ? resolvedSearchParams.search[0]
      : resolvedSearchParams.search;
  }

  if (resolvedSearchParams.year) {
    const yearValue = Array.isArray(resolvedSearchParams.year)
      ? resolvedSearchParams.year[0]
      : resolvedSearchParams.year;
    const yearNum = parseInt(yearValue);
    if (!isNaN(yearNum)) {
      filters.year = yearNum;
    }
  }

  if (resolvedSearchParams.watch_status) {
    filters.watch_status = (
      Array.isArray(resolvedSearchParams.watch_status)
        ? resolvedSearchParams.watch_status[0]
        : resolvedSearchParams.watch_status
    ) as WatchStatus;
  }

  // Buscar dados dos filmes
  const movies = await fetchMoviesData(user.id, filters);

  // Calcular estatísticas em tempo real
  const totalMovies = movies.length;
  const totalWatchTime = movies.reduce((sum, m) => sum + (m.duration || 0), 0);
  const watchedMovies = movies.filter(
    (m) => m.watch_status === "completed",
  ).length;
  const averageRating =
    movies.length > 0
      ? movies.reduce((sum, m) => sum + (m.rating || 0), 0) / movies.length
      : 0;

  const averageDuration =
    movies.length > 0 ? Math.round(totalWatchTime / movies.length) : 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 shadow-lg">
                  <Film className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                    Meus Filmes
                  </h1>
                  <p className="text-muted-foreground mt-1 max-w-2xl">
                    Sua cinemateca pessoal • {totalMovies} filmes catalogados
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="gap-2 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-500/90 hover:to-green-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Link href="/movies/new">
                  <Plus className="h-4 w-4" />
                  Novo Filme
                </Link>
              </Button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={FilmIcon}
              title="Total"
              subtitle="Filmes"
              value={totalMovies}
              color="text-emerald-500"
              progress={
                totalMovies > 0
                  ? Math.min((watchedMovies / totalMovies) * 100, 100)
                  : 0
              }
            />

            <StatsCard
              icon={Clock}
              title="Tempo"
              subtitle="Horas Assistidas"
              value={`${Math.round(totalWatchTime / 60)}h`}
              color="text-blue-500"
              progress={Math.round(
                Math.min((totalWatchTime / (totalMovies * 180)) * 100, 100),
              )}
            />

            <StatsCard
              icon={Star}
              title="Avaliação"
              subtitle="Média Geral"
              value={averageRating.toFixed(1)}
              color="text-yellow-500"
              progress={Math.round((averageRating / 10) * 100)}
            />

            <StatsCard
              icon={Calendar}
              title="Duração"
              subtitle="Média por Filme"
              value={`${averageDuration}m`}
              color="text-purple-500"
              progress={Math.round(
                Math.min((averageDuration / 180) * 100, 100),
              )}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Watch Status Distribution */}
            <div className="bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Status de Visualização
              </h3>
              <div className="space-y-4">
                {[
                  {
                    status: "Assistidos",
                    count: watchedMovies,
                    color: "bg-emerald-500",
                  },
                  {
                    status: "Em Progresso",
                    count: movies.filter((m) => m.watch_status === "watching")
                      .length,
                    color: "bg-blue-500",
                  },
                  {
                    status: "Planejados",
                    count: movies.filter((m) => m.watch_status === "planned")
                      .length,
                    color: "bg-amber-500",
                  },
                  {
                    status: "Reassistindo",
                    count: movies.filter((m) => m.watch_status === "rewatching")
                      .length,
                    color: "bg-purple-500",
                  },
                  {
                    status: "Abandonados",
                    count: movies.filter((m) => m.watch_status === "abandoned")
                      .length,
                    color: "bg-rose-500",
                  },
                ].map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.status}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{
                          width: `${totalMovies > 0 ? (item.count / totalMovies) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Rated Movies */}
            <div className="bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                Melhor Avaliados
              </h3>
              <div className="space-y-4">
                {movies
                  .filter((m) => m.rating && m.rating >= 8)
                  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                  .slice(0, 3)
                  .map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/movies/${movie.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-300 group"
                    >
                      {movie.cover_image ? (
                        <img
                          src={movie.cover_image}
                          alt={movie.name || "Filme sem nome"}
                          className="h-12 w-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                          <Film className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-emerald-500 transition-colors">
                          {movie.name || "Filme sem nome"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">
                              {movie.rating?.toFixed(1)}
                            </span>
                          </div>
                          {movie.release_year && (
                            <span className="text-xs text-muted-foreground">
                              • {movie.release_year}
                            </span>
                          )}
                          {movie.duration && (
                            <span className="text-xs text-muted-foreground">
                              • {movie.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                    </Link>
                  ))}
                {movies.filter((m) => m.rating && m.rating >= 8).length ===
                  0 && (
                  <p className="text-muted-foreground text-sm">
                    Nenhum filme altamente avaliado ainda
                  </p>
                )}
              </div>
            </div>

            {/* Recent Movies */}
            <div className="bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Adicionados Recentemente
              </h3>
              <div className="space-y-4">
                {movies.slice(0, 3).map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-300 group"
                  >
                    {movie.cover_image ? (
                      <img
                        src={movie.cover_image}
                        alt={movie.name || "Filme sem nome"}
                        className="h-12 w-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                        <Film className="h-5 w-5 text-muted-foreground group-hover:text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-blue-500 transition-colors">
                        {movie.name || "Filme sem nome"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(movie.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                        {movie.watched_date && (
                          <Badge variant="outline" className="text-xs">
                            Assistido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Movies List Component */}
          <MoviesList movies={movies} user={user} />
        </div>
      </main>
    </div>
  );
}
