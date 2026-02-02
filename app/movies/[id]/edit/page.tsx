// app/movies/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MovieForm } from "@/components/movies/MovieForm";

async function fetchMovieForEdit(movieId: string, userId: string) {
  const supabase = await createClient();

  // Buscar filme
  const { data: movie } = await supabase
    .from("content")
    .select("*")
    .eq("id", movieId)
    .eq("user_id", userId)
    .eq("type", "movie")
    .single();

  if (!movie) return null;

  // Buscar dados relacionados
  const [{ data: actors }, { data: crew }, { data: genres }] =
    await Promise.all([
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
    ]);

  return {
    movie,
    actors: actors || [],
    crew: crew || [],
    genres: genres || [],
  };
}

export default async function EditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // DESESTRUTURAR A PROMISE - ADICIONAR ESTA LINHA
  const { id } = await params;

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

  // Validação do ID
  if (!id || id === "undefined" || id === "null") {
    redirect("/movies");
  }

  // Verifica se é um UUID válido
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    redirect("/movies");
  }

  // Buscar filme existente - USAR id ao invés de params.id
  const movieData = await fetchMovieForEdit(id, user.id);

  if (!movieData) {
    notFound();
  }

  // Buscar gêneros disponíveis
  const { data: allGenres } = await supabase
    .from("genres")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  // Buscar atores disponíveis
  const { data: allActors } = await supabase
    .from("actors")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Editar Filme: {movieData.movie.name}
            </h1>
            <p className="text-muted-foreground">
              Atualize os detalhes do filme
            </p>
          </div>

          <MovieForm
            userId={user.id}
            genres={allGenres || []}
            actors={allActors || []}
            movie={movieData.movie}
            existingActors={movieData.actors}
            existingCrew={movieData.crew}
            existingGenres={movieData.genres}
            isEditing={true}
          />
        </div>
      </main>
    </div>
  );
}
