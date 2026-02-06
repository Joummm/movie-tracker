// app/api/episodes/[id]/mark-watched/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const episodeId = params.id;

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar episódio para verificar se pertence ao usuário
    const { data: episode, error: fetchError } = await supabase
      .from("series_episodes")
      .select(
        `
        *,
        series:series_id (
          user_id
        )
      `,
      )
      .eq("id", episodeId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json(
        { error: "Episódio não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se a série pertence ao usuário
    if (episode.series.user_id !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Atualizar episódio como visto
    const { error: updateError } = await supabase
      .from("series_episodes")
      .update({
        is_watched: true,
        watched_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", episodeId);

    if (updateError) {
      throw updateError;
    }

    // Atualizar contagem de episódios assistidos na temporada
    const { data: seasonEpisodes } = await supabase
      .from("series_episodes")
      .select("id, is_watched")
      .eq("season_id", episode.season_id);

    if (seasonEpisodes) {
      const watchedCount = seasonEpisodes.filter((ep) => ep.is_watched).length;

      await supabase
        .from("series_seasons")
        .update({
          watched_episode_count: watchedCount,
        })
        .eq("id", episode.season_id);
    }

    return NextResponse.json({
      success: true,
      message: "Episódio marcado como visto",
    });
  } catch (error: any) {
    console.error("Error marking episode as watched:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
