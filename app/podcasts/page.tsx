import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PodcastsList } from "@/components/podcasts/podcasts-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PodcastsListSkeleton } from "@/components/podcasts/podcasts-list-skeleton";

export default async function PodcastsPage() {
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

  // Get all podcasts for this user
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select(
      `
      *,
      episodes:podcast_episodes(*)
    `,
    )
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Meus Podcasts</h1>
            <Button asChild>
              <Link href="/podcasts/new">
                <Plus className="h-4 w-4 mr-2" />
                Novo Podcast
              </Link>
            </Button>
          </div>
          <Suspense fallback={<PodcastsListSkeleton />}>
            <PodcastsList podcasts={podcasts || []} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
