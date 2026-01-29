// app/series/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EditSeriesForm } from "@/components/series/forms/edit-series-form";

interface EditSeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSeriesPage({ params }: EditSeriesPageProps) {
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

  // Get series data
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("*")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    console.error("Error fetching series:", seriesError);
    redirect("/series");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <EditSeriesForm series={series} userId={user.id} />
        </div>
      </main>
    </div>
  );
}
