// app/others/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OtherContentForm } from "@/components/others/OtherContentForm";

async function fetchOtherForEdit(contentId: string, userId: string) {
  const supabase = await createClient();

  // Buscar conteúdo
  const { data: content } = await supabase
    .from("content")
    .select("*")
    .eq("id", contentId)
    .eq("user_id", userId)
    .eq("type", "other")
    .single();

  if (!content) return null;

  // Buscar dados relacionados
  const [{ data: actors }, { data: crew }, { data: genres }] =
    await Promise.all([
      supabase
        .from("content_actors")
        .select("*, actor:actors(*)")
        .eq("content_id", contentId)
        .order("credit_order", { ascending: true }),
      supabase
        .from("content_crew")
        .select("*, person:actors(*)")
        .eq("content_id", contentId),
      supabase
        .from("content_genres")
        .select("*, genre:genres(*)")
        .eq("content_id", contentId),
    ]);

  return {
    content,
    actors: actors || [],
    crew: crew || [],
    genres: genres || [],
  };
}

export default async function EditOtherContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    redirect("/outros");
  }

  // Verifica se é um UUID válido
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    redirect("/outros");
  }

  // Buscar conteúdo existente
  const contentData = await fetchOtherForEdit(id, user.id);

  if (!contentData) {
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
              Editar Conteúdo: {contentData.content.name}
            </h1>
            <p className="text-muted-foreground">
              Atualize os detalhes do conteúdo
            </p>
          </div>

          <OtherContentForm
            userId={user.id}
            genres={allGenres || []}
            actors={allActors || []}
            content={contentData.content}
            existingActors={contentData.actors}
            existingCrew={contentData.crew}
            existingGenres={contentData.genres}
            isEditing={true}
          />
        </div>
      </main>
    </div>
  );
}
