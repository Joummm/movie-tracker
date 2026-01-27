import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SeriesList } from "@/components/series/series-list";

export default async function SeriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get all series with first and last episode dates
  const { data: series } = await supabase
    .from("series")
    .select("*, content(watched_date, season, episode, rating)")
    .eq("user_id", user.id)
    .order("name");

  // Process series to calculate first and last episode dates and average rating
  const seriesWithDates = series?.map((s) => {
    const episodes = (s.content as any[]) || [];
    const sortedDates = episodes.map((e) => e.watched_date).sort();

    // Calculate average rating
    const ratedEpisodes = episodes.filter((e) => e.rating !== null);
    const avgRating =
      ratedEpisodes.length > 0
        ? ratedEpisodes.reduce((acc, e) => acc + (e.rating || 0), 0) /
          ratedEpisodes.length
        : 0;

    return {
      ...s,
      firstEpisodeDate: sortedDates[0] || null,
      lastEpisodeDate: sortedDates[sortedDates.length - 1] || null,
      totalEpisodes: episodes.length,
      seasons: [...new Set(episodes.map((e) => e.season))].length,
      avgRating,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <SeriesList series={seriesWithDates || []} />
      </main>
    </div>
  );
}
