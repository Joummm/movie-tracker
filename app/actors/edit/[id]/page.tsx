import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActorForm } from "@/components/actors/actor-form";

export default async function EditActorPage({
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

  // Get actor details
  const { data: actor } = await supabase
    .from("actors")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!actor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <ActorForm actor={actor} userId={user.id} isEdit />
      </main>
    </div>
  );
}
