// app/series/[id]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SeriesDetailView } from "@/components/series/SeriesDetailView";
import { calculateSeriesStats } from "@/components/series/utils/series-stats";

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const seriesId = id;

  // Autenticação
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/login");

  // Buscar série básica
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("*")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) redirect("/series");

  // Buscar elenco
  const { data: cast } = await supabase
    .from("series_cast")
    .select(
      `
      *,
      actors (
        id,
        name,
        photo_url,
        role
      )
    `,
    )
    .eq("series_id", seriesId)
    .order("is_main_cast", { ascending: false })
    .order("created_at", { ascending: true });

  // Calcular estatísticas
  const stats = await calculateSeriesStats(supabase, seriesId, user.id);

  // Buscar temporadas
  const { data: seasons } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .order("season_number", { ascending: true });

  // Preparar dados da série
  const seriesData = {
    id: series.id,
    user_id: series.user_id,
    name: series.name,
    cover_image: series.cover_image,
    release_year: series.release_year,
    status: series.status as
      | "in_progress"
      | "abandoned"
      | "completed"
      | "planned",
    total_seasons: series.total_seasons,
    total_episodes: series.total_episodes,
    description: series.description,
    created_at: series.created_at,
    updated_at: series.updated_at,
    poster_vertical: series.poster_vertical,
    poster_horizontal: series.poster_horizontal,
    would_recommend: series.would_recommend,
    would_rewatch: series.would_rewatch,
    average_rating: series.average_rating,
    total_watch_time: series.total_watch_time,
    has_special_seasons: series.has_special_seasons,
    start_date: series.start_date,
    end_date: series.end_date,
    stats: {
      total_episodes: stats.total_episodes,
      watched_episodes: stats.watched_episodes,
      total_seasons: stats.total_seasons,
      watched_seasons: stats.watched_seasons,
      completion_percentage: stats.completion_percentage,
      average_rating: stats.average_rating,
      total_watch_time: series.total_watch_time || stats.total_watch_time,
      total_watch_hours: Math.round(
        (series.total_watch_time || stats.total_watch_time) / 60,
      ),
    },
    seasons: seasons || stats.seasons || [],
    cast: cast || [],
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-background/95">
      <DashboardHeader userName={user.email?.split("@")[0] || "User"} />

      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SeriesDetailView series={seriesData} user={user} />
        </div>
      </main>
    </div>
  );
}
