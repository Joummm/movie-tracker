import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/community/copy-series
// Copies a series along with its seasons and episodes to the current user's profile
export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { targetSeriesId } = await request.json();
    if (!targetSeriesId) {
      return NextResponse.json({ error: "targetSeriesId é obrigatório" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch original series
    const { data: originalSeries, error: seriesError } = await admin
      .from("series")
      .select("*")
      .eq("id", targetSeriesId)
      .single();

    if (seriesError || !originalSeries) {
      return NextResponse.json({ error: "Série original não encontrada" }, { status: 404 });
    }

    // 2. Fetch original seasons
    const { data: originalSeasons, error: seasonsError } = await admin
      .from("series_seasons")
      .select("*")
      .eq("series_id", targetSeriesId);

    if (seasonsError) {
      return NextResponse.json({ error: "Erro ao buscar temporadas da série" }, { status: 500 });
    }

    // 3. Fetch original episodes
    const { data: originalEpisodes, error: episodesError } = await admin
      .from("series_episodes")
      .select("*")
      .eq("series_id", targetSeriesId);

    if (episodesError) {
      return NextResponse.json({ error: "Erro ao buscar episódios da série" }, { status: 500 });
    }

    // 4. Insert copied series to the current user
    const newSeriesData = {
      user_id: user.id,
      name: originalSeries.name,
      cover_image: originalSeries.cover_image,
      release_year: originalSeries.release_year,
      status: "in_progress",
      total_seasons: originalSeries.total_seasons || 0,
      total_episodes: originalSeries.total_episodes || 0,
      description: originalSeries.description,
      poster_vertical: originalSeries.poster_vertical,
      poster_horizontal: originalSeries.poster_horizontal,
    };

    const { data: newSeries, error: newSeriesError } = await supabase
      .from("series")
      .insert(newSeriesData)
      .select()
      .single();

    if (newSeriesError || !newSeries) {
      console.error(newSeriesError);
      return NextResponse.json({ error: "Erro ao criar cópia da série" }, { status: 500 });
    }

    const newSeriesId = newSeries.id;

    // 5. If there are seasons, insert them
    if (originalSeasons && originalSeasons.length > 0) {
      // Map original season IDs to new season IDs
      const seasonIdMap = new Map();

      for (const season of originalSeasons) {
        const newSeasonData = {
          series_id: newSeriesId,
          user_id: user.id,
          season_number: season.season_number,
          name: season.name,
          episode_count: season.episode_count,
          watched_episode_count: 0, // Reset watched
          is_special: season.is_special || false,
          total_watch_time: season.total_watch_time,
          poster_vertical: season.poster_vertical,
          poster_horizontal: season.poster_horizontal,
          release_year: season.release_year,
        };

        const { data: newSeason, error: newSeasonError } = await supabase
          .from("series_seasons")
          .insert(newSeasonData)
          .select()
          .single();

        if (newSeason && !newSeasonError) {
          seasonIdMap.set(season.id, newSeason.id);
        }
      }

      // 6. If there are episodes, insert them using the new season IDs
      if (originalEpisodes && originalEpisodes.length > 0) {
        const episodesToInsert = originalEpisodes
          .filter((ep) => seasonIdMap.has(ep.season_id))
          .map((ep) => ({
            series_id: newSeriesId,
            season_id: seasonIdMap.get(ep.season_id),
            episode_number: ep.episode_number,
            name: ep.name,
            duration: ep.duration,
            is_watched: false, // Reset watched
            rating: null,      // Reset rating
            review: null,      // Reset review
            last_rewatch_date: null,
            rewatch_count: 0
          }));

        // Insert episodes in batches to avoid large payload errors
        const batchSize = 100;
        for (let i = 0; i < episodesToInsert.length; i += batchSize) {
          const batch = episodesToInsert.slice(i, i + batchSize);
          await supabase.from("series_episodes").insert(batch);
        }
      }
    }

    return NextResponse.json({ success: true, newSeriesId: newSeriesId });
  } catch (error) {
    console.error("Copy series error:", error);
    return NextResponse.json({ error: "Ocorreu um erro inesperado." }, { status: 500 });
  }
}
