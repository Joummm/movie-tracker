// app/series/[id]/seasons/[seasonId]/edit/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EditSeasonForm } from "@/components/series/forms/edit-season-form";

interface EditSeasonPageProps {
  params: Promise<{
    id: string;
    seasonId: string;
  }>;
}

export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const { id, seasonId } = await params;
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

  // Get season information
  const { data: season } = await supabase
    .from("series_seasons")
    .select("*")
    .eq("id", seasonId)
    .eq("series_id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (!season) {
    redirect(`/series/${seriesId}/seasons`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <EditSeasonForm
            userId={user.id}
            seriesId={seriesId}
            seriesName={series.name || "Série"}
            season={season}
          />
        </div>
      </main>
    </div>
  );
}
