// app/series/[id]/seasons/[seasonId]/episodes/[episodeId]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EpisodeDetail } from "@/components/series/episode-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EpisodePageProps {
  params: Promise<{
    id: string;
    seasonId: string;
    episodeId: string;
  }>;
}

export default async function EpisodeDetailPage({ params }: EpisodePageProps) {
  const { id, seasonId, episodeId } = await params;
  const supabase = await createClient();
  const seriesId = id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get series info
  const { data: series } = await supabase
    .from("series")
    .select("id, name, cover_image")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!series) {
    redirect("/series");
  }

  // Get season info
  const { data: season } = await supabase
    .from("series_seasons")
    .select("id, season_number, name, is_special")
    .eq("id", seasonId)
    .eq("user_id", user.id)
    .single();

  if (!season) {
    redirect(`/series/${seriesId}/seasons`);
  }

  // Get episode data
  // Primeiro tente buscar da tabela series_episodes
  let episode: any = null;
  const { data: episodeFromTable } = await supabase
    .from("series_episodes")
    .select("*")
    .eq("id", episodeId)
    .eq("user_id", user.id)
    .single();

  if (episodeFromTable) {
    episode = episodeFromTable;
  } else {
    // Se não encontrar, tente buscar da tabela content
    const { data: episodeFromContent } = await supabase
      .from("content")
      .select("*")
      .eq("id", episodeId)
      .eq("user_id", user.id)
      .single();

    if (episodeFromContent) {
      episode = {
        id: episodeFromContent.id,
        episode_number: episodeFromContent.episode || 0,
        name: episodeFromContent.name,
        duration: episodeFromContent.duration,
        is_watched: episodeFromContent.watch_status === 'completed',
        rating: episodeFromContent.rating,
        review: episodeFromContent.review,
        release_date: episodeFromContent.watched_date,
        created_at: episodeFromContent.created_at,
        updated_at: episodeFromContent.updated_at,
        would_recommend: episodeFromContent.would_recommend,
        would_rewatch: episodeFromContent.would_rewatch,
        rewatch_count: episodeFromContent.rewatch_count,
        last_rewatch_date: episodeFromContent.last_rewatch_date,
        notes: episodeFromContent.notes,
        content_id: episodeFromContent.id
      };
    }
  }

  if (!episode) {
    // Se ainda não encontrar, crie um objeto de placeholder
    episode = {
      id: episodeId,
      episode_number: 1,
      name: "Episódio",
      duration: 45,
      is_watched: false,
      rating: null,
      review: "",
      release_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Get next and previous episodes
  const { data: allEpisodes } = await supabase
    .from("series_episodes")
    .select("id, episode_number, name")
    .eq("season_id", seasonId)
    .eq("user_id", user.id)
    .order("episode_number", { ascending: true });

  let nextEpisode: any = null;
  let previousEpisode: any = null;

  if (allEpisodes && allEpisodes.length > 0) {
    const currentIndex = allEpisodes.findIndex(ep => ep.id === episodeId);
    if (currentIndex > 0) {
      previousEpisode = allEpisodes[currentIndex - 1];
    }
    if (currentIndex < allEpisodes.length - 1) {
      nextEpisode = allEpisodes[currentIndex + 1];
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={user.email?.split('@')[0] || "User"} />
      
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="h-10 w-10"
              >
                <Link href={`/series/${seriesId}/seasons/${seasonId}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {episode.name || `Episódio ${episode.episode_number}`}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Link 
                    href={`/series/${seriesId}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {series.name}
                  </Link>
                  <span>•</span>
                  <Link 
                    href={`/series/${seriesId}/seasons/${seasonId}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {season.is_special ? 'Especial' : `Temporada ${season.season_number}`}
                    {season.name && `: ${season.name}`}
                  </Link>
                  <span>•</span>
                  <span>Episódio {episode.episode_number}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/series/${seriesId}/seasons/${seasonId}/episodes/${episodeId}/edit`}>
                  Editar
                </Link>
              </Button>
            </div>
          </div>

          {/* Episode Detail */}
          <EpisodeDetail 
            episode={episode}
            seriesId={seriesId}
            seasonId={seasonId}
            seasonNumber={season.season_number}
            seasonName={season.name}
            isSpecialSeason={season.is_special}
            seriesName={series.name}
            nextEpisode={nextEpisode}
            previousEpisode={previousEpisode}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}