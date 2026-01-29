// app/series/[id]/cast/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CastManagement } from "@/components/series/cast-management";

interface CastPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CastPage({ params }: CastPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const seriesId = id;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get series information
  const { data: series } = await supabase
    .from("series")
    .select("id, name")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!series) {
    redirect("/series");
  }

  // Get all cast for this series
  const { data: cast } = await supabase
    .from("series_cast")
    .select(
      `
      *,
      actors!series_cast_actor_id_fkey (
        id,
        name,
        photo_url,
        role
      )
    `,
    )
    .eq("series_id", seriesId)
    .order("is_main_cast", { ascending: false })
    .order("character_name");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <CastManagement
            seriesId={seriesId}
            seriesName={series.name || "Série"}
            cast={cast || []}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
