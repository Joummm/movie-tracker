// app/series/[id]/seasons/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SeasonsList } from "@/components/series/seasons-list";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SeasonsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeasonsPage({ params }: SeasonsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const seriesId = id;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get series info
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, name, cover_image")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    console.error("Error fetching series:", seriesError);
    redirect("/series");
  }

  // Get all seasons for this series - query simplificada
  const { data: seasons, error: seasonsError } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .order("season_number", { ascending: true });

  console.log("Seasons data:", seasons); // Debug
  console.log("Seasons error:", seasonsError); // Debug

  // Se não houver temporadas, não é um erro - pode ser que a série ainda não tenha temporadas
  if (seasonsError) {
    console.error("Error fetching seasons:", seasonsError);
    // Não redirecionamos, apenas mostramos lista vazia
  }

  // Calculate statistics
  const totalSeasons = seasons?.length || 0;
  const totalEpisodes =
    seasons?.reduce(
      (sum: number, season: any) => sum + (season.episode_count || 0),
      0,
    ) || 0;
  const watchedEpisodes =
    seasons?.reduce(
      (sum: number, season: any) => sum + (season.watched_episode_count || 0),
      0,
    ) || 0;
  const completedSeasons =
    seasons?.filter(
      (season: any) => season.watched_episode_count === season.episode_count,
    ).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="h-10 w-10"
                >
                  <Link href={`/series/${seriesId}`}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Temporadas de {series.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Gerencie todas as temporadas da série
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={`/series/${seriesId}/seasons/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Temporada
                  </Link>
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Total de Temporadas
                </p>
                <p className="text-2xl font-bold">{totalSeasons}</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Completas</p>
                <p className="text-2xl font-bold">{completedSeasons}</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Total de Episódios
                </p>
                <p className="text-2xl font-bold">{totalEpisodes}</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Assistidos</p>
                <p className="text-2xl font-bold">
                  {watchedEpisodes}/{totalEpisodes}
                </p>
              </div>
            </div>

            {/* Seasons List */}
            <SeasonsList
              seasons={seasons || []}
              seriesId={seriesId}
              seriesName={series.name || "Série"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
