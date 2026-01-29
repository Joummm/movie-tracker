// app/series/[id]/seasons/new/page.tsx (corrigido)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NewSeasonForm } from "@/components/series/forms/new-season-form";

interface NewSeasonPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewSeasonPage({ params }: NewSeasonPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const seriesId = id;

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

  // Get series information
  const { data: series } = await supabase
    .from("series")
    .select("id, name, total_seasons")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!series) {
    redirect("/series");
  }

  // Get existing seasons to determine next season number
  const { data: existingSeasons } = await supabase
    .from("series_seasons")
    .select("season_number, is_special")
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .order("season_number");

  // Calculate next season number - CORREÇÃO AQUI
  const regularSeasons = existingSeasons?.filter(s => !s.is_special) || [];
  const nextSeasonNumber = regularSeasons.length > 0 
    ? Math.max(...regularSeasons.map(s => s.season_number)) + 1
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <NewSeasonForm 
            userId={user.id} 
            seriesId={seriesId}
            seriesName={series.name || "Série"}
            nextSeasonNumber={nextSeasonNumber}
            existingSeasons={existingSeasons || []}
          />
        </div>
      </main>
    </div>
  );
}