// app/series/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EditSeriesForm } from "@/components/series/forms/EditSeriesForm";

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

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

  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!series) {
    redirect("/series");
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <EditSeriesForm series={series} />
        </div>
      </main>
    </div>
  );
}
