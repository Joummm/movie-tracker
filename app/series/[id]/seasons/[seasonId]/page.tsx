// app/series/[id]/seasons/[seasonId]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SeasonDetail } from "@/components/series/season-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SeasonPageProps {
  params: Promise<{
    id: string;
    seasonId: string;
  }>;
}

export default async function SeasonDetailPage({ params }: SeasonPageProps) {
  const { id, seasonId } = await params;
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
    .select("id, name")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    console.error("Error fetching series:", seriesError);
    redirect("/series");
  }

  // Get season data
  const { data: season, error: seasonError } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("id", seasonId)
    .eq("user_id", user.id)
    .single();

  console.log("Season data:", season); // Debug
  console.log("Season error:", seasonError); // Debug

  if (seasonError || !season) {
    console.error("Error fetching season:", seasonError);
    redirect(`/series/${seriesId}/seasons`);
  }

  // Tente buscar episódios de diferentes maneiras
  let episodes: any[] = [];
  let episodesError: any = null;

  // Primeiro tente buscar da tabela series_episodes
  const { data: episodesFromTable, error: episodesError1 } = await supabase
    .from("series_episodes")
    .select("*")
    .eq("season_id", seasonId)
    .eq("user_id", user.id)
    .order("episode_number", { ascending: true });

  if (!episodesError1 && episodesFromTable) {
    episodes = episodesFromTable;
  } else {
    console.log("Trying content table for episodes...");
    // Se não encontrar, tente buscar da tabela content
    const { data: episodesFromContent, error: episodesError2 } = await supabase
      .from("content")
      .select("*")
      .eq("series_id", seriesId)
      .eq("season", season.season_number)
      .eq("user_id", user.id)
      .order("episode", { ascending: true });

    if (!episodesError2 && episodesFromContent) {
      episodes = episodesFromContent.map((content: any) => ({
        id: content.id,
        episode_number: content.episode || 0,
        name: content.name,
        duration: content.duration,
        is_watched: content.watch_status === 'completed',
        rating: content.rating,
        review: content.review,
        release_date: content.watched_date,
        created_at: content.created_at
      }));
    } else {
      episodesError = episodesError2;
    }
  }

  if (episodesError) {
    console.log("No episodes found, using empty array");
    episodes = [];
  }

  console.log("Episodes found:", episodes.length); // Debug

  // Get series info for the season
  const { data: seriesInfo } = await supabase
    .from("series")
    .select("id, name, cover_image")
    .eq("id", season.series_id)
    .single();

  const seasonWithSeries = {
    ...season,
    series: seriesInfo || { id: seriesId, name: series.name }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-10 w-10"
            >
              <Link href={`/series/${seriesId}/seasons`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {season.is_special ? "Especial" : `Temporada ${season.season_number}`}
                {season.name && `: ${season.name}`}
              </h1>
              <p className="text-muted-foreground mt-1">
                {series.name}
              </p>
            </div>
          </div>

          {/* Season Detail */}
          <SeasonDetail 
            season={seasonWithSeries}
            seriesId={seriesId}
            episodes={episodes}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}