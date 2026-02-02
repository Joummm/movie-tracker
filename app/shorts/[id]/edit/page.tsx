// app/shorts/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ShortForm } from "@/components/shorts/ShortForm";

async function fetchShortForEdit(shortId: string, userId: string) {
  const supabase = await createClient();

  // Buscar short
  const { data: short } = await supabase
    .from("content")
    .select("*")
    .eq("id", shortId)
    .eq("user_id", userId)
    .eq("type", "short")
    .single();

  if (!short) return null;

  // Buscar dados relacionados
  const [{ data: actors }, { data: crew }, { data: genres }] =
    await Promise.all([
      supabase
        .from("content_actors")
        .select("*, actor:actors(*)")
        .eq("content_id", shortId)
        .order("credit_order", { ascending: true }),
      supabase
        .from("content_crew")
        .select("*, person:actors(*)")
        .eq("content_id", shortId),
      supabase
        .from("content_genres")
        .select("*, genre:genres(*)")
        .eq("content_id", shortId),
    ]);

  return {
    short,
    actors: actors || [],
    crew: crew || [],
    genres: genres || [],
  };
}

export default async function EditShortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // DESESTRUTURAR A PROMISE
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
    redirect("/shorts");
  }

  // Verifica se é um UUID válido
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    redirect("/shorts");
  }

  // Buscar short existente
  const shortData = await fetchShortForEdit(id, user.id);

  if (!shortData) {
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
              Editar Curta-Metragem: {shortData.short.name}
            </h1>
            <p className="text-muted-foreground">
              Atualize os detalhes do curta-metragem
            </p>
          </div>

          <ShortForm
            userId={user.id}
            genres={allGenres || []}
            actors={allActors || []}
            short={shortData.short}
            existingActors={shortData.actors}
            existingCrew={shortData.crew}
            existingGenres={shortData.genres}
            isEditing={true}
          />
        </div>
      </main>
    </div>
  );
}
