// app/others/new/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OtherContentForm } from "@/components/others/OtherContentForm";

export default async function NewOtherContentPage() {
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

  // Buscar gêneros disponíveis
  const { data: genres } = await supabase
    .from("genres")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  // Buscar atores disponíveis
  const { data: actors } = await supabase
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
              Adicionar Novo Conteúdo
            </h1>
            <p className="text-muted-foreground">
              Preencha os detalhes do conteúdo para adicioná-lo à sua coleção
            </p>
          </div>

          <OtherContentForm
            userId={user.id}
            genres={genres || []}
            actors={actors || []}
          />
        </div>
      </main>
    </div>
  );
}
