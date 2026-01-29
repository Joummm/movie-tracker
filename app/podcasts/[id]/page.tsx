import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PodcastDetail } from "@/components/podcasts/podcast-detail";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function PodcastDetailPage({
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

  // Get podcast details
  const { data: podcast } = await supabase
    .from("podcasts")
    .select(
      `
      *,
      episodes:podcast_episodes(*)
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!podcast) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/podcasts">← Voltar</Link>
            </Button>
            <Button asChild>
              <Link href={`/podcasts/${podcast.id}/episodes/add`}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Episódio
              </Link>
            </Button>
          </div>
          <PodcastDetail podcast={podcast} />
        </div>
      </main>
    </div>
  );
}
