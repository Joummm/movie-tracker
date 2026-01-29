// app/series/[id]/seasons/[seasonId]/episodes/[episodeId]/edit/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EditEpisodeForm } from "@/components/series/forms/edit-episode-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditEpisodePageProps {
  params: Promise<{
    id: string;
    seasonId: string;
    episodeId: string;
  }>;
}

export default async function EditEpisodePage({
  params,
}: EditEpisodePageProps) {
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
    .select("id, name")
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
        is_watched: episodeFromContent.watch_status === "completed",
        rating: episodeFromContent.rating,
        review: episodeFromContent.review,
        release_date: episodeFromContent.watched_date,
        would_recommend: episodeFromContent.would_recommend,
        would_rewatch: episodeFromContent.would_rewatch,
        rewatch_count: episodeFromContent.rewatch_count,
        last_rewatch_date: episodeFromContent.last_rewatch_date,
        notes: episodeFromContent.notes,
      };
    }
  }

  if (!episode) {
    redirect(`/series/${seriesId}/seasons/${seasonId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={user.email?.split("@")[0] || "User"} />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild className="h-10 w-10">
              <Link
                href={`/series/${seriesId}/seasons/${seasonId}/episodes/${episodeId}`}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Editar Episódio
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <span>{series.name}</span>
                <span>•</span>
                <span>
                  {season.is_special
                    ? "Especial"
                    : `Temporada ${season.season_number}`}
                  {season.name && `: ${season.name}`}
                </span>
                <span>•</span>
                <span>
                  {episode.name || `Episódio ${episode.episode_number}`}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <EditEpisodeForm
            episode={episode}
            seriesId={seriesId}
            seasonId={seasonId}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
