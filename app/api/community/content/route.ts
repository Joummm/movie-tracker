import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET /api/community/content?userId=xxx - Get ALL content types for a specific user (bypassing RLS)
export async function GET(request: NextRequest) {
  // Verify the requesting user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch all data types in parallel
  const [contentRes, seriesRes, podcastsRes, podcastEpisodesRes] = await Promise.all([
    admin.from("content").select("*, series(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("series").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("podcasts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("podcast_episodes").select("*, podcasts(*)").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  // Separate content by type
  const allContent = contentRes.data || [];
  const movies = allContent.filter((c: any) => c.type === "movie");
  const episodes = allContent.filter((c: any) => c.type === "episode");
  const shorts = allContent.filter((c: any) => c.type === "short");
  const others = allContent.filter((c: any) => c.type === "other");

  return NextResponse.json({
    movies,
    episodes,
    shorts,
    others,
    series: seriesRes.data || [],
    podcasts: podcastsRes.data || [],
    podcastEpisodes: podcastEpisodesRes.data || [],
  });
}
