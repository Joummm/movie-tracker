import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ContentTypeSelector } from "@/components/content/ContentTypeSelector";

export default async function AddContentPage() {
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

  // Get user's series for the dropdown
  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <ContentTypeSelector userSeries={series || []} userId={user.id} />
      </main>
    </div>
  );
}
