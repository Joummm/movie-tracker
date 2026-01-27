import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ContentList } from "@/components/content/content-list";
import { ContentFilters } from "@/components/content/content-filters";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    week?: string;
    day?: string;
    view?: string;
    type?: string;
    releaseYear?: string;
    sort?: string;
  }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

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

  // Build query for content (movies, series episodes, etc.)
  let query = supabase
    .from("content")
    .select("*, series(*)")
    .eq("user_id", user.id);

  // Build query for podcast episodes
  let podcastQuery = supabase
    .from("podcast_episodes")
    .select("*, podcasts(*)")
    .eq("user_id", user.id);

  if (params.releaseYear) {
    const releaseYear = Number.parseInt(params.releaseYear);
    query = query.or(
      `release_year.eq.${releaseYear},series.release_year.eq.${releaseYear}`,
    );
    podcastQuery = podcastQuery.or(
      `release_year.eq.${releaseYear},podcasts.release_year.eq.${releaseYear}`,
    );
  } else {
    // Only apply watched date filters if not filtering by release year
    if (params.day) {
      query = query.eq("watched_date", params.day);
      podcastQuery = podcastQuery.eq("watched_date", params.day);
    } else if (params.week && params.year) {
      const [year, week] = [
        Number.parseInt(params.year),
        Number.parseInt(params.week),
      ];
      const startDate = getDateOfWeek(week, year);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      query = query
        .gte("watched_date", startDateStr)
        .lte("watched_date", endDateStr);
      podcastQuery = podcastQuery
        .gte("watched_date", startDateStr)
        .lte("watched_date", endDateStr);
    } else if (params.month && params.year) {
      const year = Number.parseInt(params.year);
      const month = Number.parseInt(params.month);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      query = query
        .gte("watched_date", startDateStr)
        .lte("watched_date", endDateStr);
      podcastQuery = podcastQuery
        .gte("watched_date", startDateStr)
        .lte("watched_date", endDateStr);
    } else if (params.year) {
      const year = Number.parseInt(params.year);
      query = query
        .gte("watched_date", `${year}-01-01`)
        .lte("watched_date", `${year}-12-31`);
      podcastQuery = podcastQuery
        .gte("watched_date", `${year}-01-01`)
        .lte("watched_date", `${year}-12-31`);
    }
  }

  // Filter by type
  if (params.type && params.type !== "all") {
    if (params.type === "podcast") {
      // For podcasts, we'll handle separately
      query = query.neq("type", "podcast"); // Filter out podcasts from content query
      podcastQuery = podcastQuery; // Keep all podcast episodes
    } else if (params.type === "podcast_episode") {
      // If specifically looking for podcast episodes
      query = supabase
        .from("content")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", "00000000-0000-0000-0000-000000000000"); // Empty query
      // Podcast episodes will be handled separately
    } else {
      query = query.eq("type", params.type);
      podcastQuery = supabase
        .from("podcast_episodes")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", "00000000-0000-0000-0000-000000000000"); // Empty query
    }
  }

  const [{ data: content = [] }, { data: podcastEpisodes = [] }] =
    await Promise.all([
      query.order("watched_date", { ascending: false }),
      podcastQuery.order("watched_date", { ascending: false }),
    ]);

  // Transform podcast episodes to match content structure
  const transformedPodcastEpisodes = (podcastEpisodes || []).map((ep: any) => ({
    id: ep.id,
    user_id: ep.user_id,
    type: "podcast_episode" as const,
    name: ep.name,
    cover_image: ep.cover_image || ep.podcasts?.cover_image,
    rating: ep.rating,
    duration: ep.duration,
    watched_date: ep.watched_date,
    notes: ep.notes,
    review: ep.review,
    created_at: ep.created_at,
    updated_at: ep.updated_at,
    release_year: ep.release_year || ep.podcasts?.release_year,
    podcast_id: ep.podcast_id,
    podcast: ep.podcasts,
    season: ep.season,
    episode: ep.episode_number,
    date_unknown: ep.date_unknown,
  }));

  // Combine content and podcast episodes
  const allContent = [...(content || []), ...transformedPodcastEpisodes];

  // Get available years from all content
  const { data: contentDates = [] } = await supabase
    .from("content")
    .select("watched_date")
    .eq("user_id", user.id)
    .not("watched_date", "is", null);

  const { data: podcastDates = [] } = await supabase
    .from("podcast_episodes")
    .select("watched_date")
    .eq("user_id", user.id)
    .not("watched_date", "is", null);

  const allDates = [...(contentDates || []), ...(podcastDates || [])];
  const years = Array.from(
    new Set(
      allDates
        .map((c: any) =>
          c.watched_date ? new Date(c.watched_date).getFullYear() : null,
        )
        .filter((year): year is number => year !== null && !isNaN(year))
        .sort((a, b) => b - a),
    ),
  );

  const { data: allContentWithRelease = [] } = await supabase
    .from("content")
    .select("release_year, series(release_year)")
    .eq("user_id", user.id);

  const { data: allPodcastsWithRelease = [] } = await supabase
    .from("podcasts")
    .select("release_year")
    .eq("user_id", user.id);

  const releaseYears = Array.from(
    new Set(
      [
        ...(allContentWithRelease || []).map(
          (c: any) => c.release_year || c.series?.release_year,
        ),
        ...(allPodcastsWithRelease || []).map((p: any) => p.release_year),
      ]
        .filter((y): y is number => y !== null && y !== undefined)
        .sort((a, b) => b - a),
    ),
  );

  let sortedContent = allContent || [];
  const sortType = params.sort || "newest";

  switch (sortType) {
    case "alphabetical-az":
      sortedContent = [...sortedContent].sort((a: any, b: any) => {
        const nameA = a.name || a.series?.name || a.podcast?.name || "";
        const nameB = b.name || b.series?.name || b.podcast?.name || "";
        return nameA.localeCompare(nameB);
      });
      break;
    case "alphabetical-za":
      sortedContent = [...sortedContent].sort((a: any, b: any) => {
        const nameA = a.name || a.series?.name || a.podcast?.name || "";
        const nameB = b.name || b.series?.name || b.podcast?.name || "";
        return nameB.localeCompare(nameA);
      });
      break;
    case "oldest":
      sortedContent = [...sortedContent].sort((a: any, b: any) => {
        const dateA = a.watched_date ? new Date(a.watched_date).getTime() : 0;
        const dateB = b.watched_date ? new Date(b.watched_date).getTime() : 0;
        return dateA - dateB;
      });
      break;
    case "highest-rated":
      sortedContent = [...sortedContent].sort(
        (a: any, b: any) => (b.rating || 0) - (a.rating || 0),
      );
      break;
    case "lowest-rated":
      sortedContent = [...sortedContent].sort(
        (a: any, b: any) => (a.rating || 0) - (b.rating || 0),
      );
      break;
    case "newest":
    default:
      sortedContent = [...sortedContent].sort((a: any, b: any) => {
        const dateA = a.watched_date ? new Date(a.watched_date).getTime() : 0;
        const dateB = b.watched_date ? new Date(b.watched_date).getTime() : 0;
        return dateB - dateA;
      });
      break;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <ContentFilters
            years={years}
            releaseYears={releaseYears}
            selectedYear={params.year}
            selectedMonth={params.month}
            selectedWeek={params.week}
            selectedDay={params.day}
            selectedView={params.view || "all"}
            selectedType={params.type || "all"}
            selectedReleaseYear={params.releaseYear}
          />
          <ContentList
            content={sortedContent}
            view={params.view || "all"}
            releaseYearView={!!params.releaseYear}
          />
        </div>
      </main>
    </div>
  );
}

function getDateOfWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}
