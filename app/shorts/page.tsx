// app/shorts/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Clapperboard, Plus } from "lucide-react";
import Link from "next/link";

export default async function ShortsPage() {
  const supabase = await createClient();

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

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clapperboard className="h-6 w-6 text-orange-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Curtas-Metragens
                </h1>
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Acompanhe todas as suas curtas-metragens assistidas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="gap-2 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-500/90 hover:to-amber-600/90 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Link href="/shorts/new">
                  <Plus className="h-4 w-4" />
                  Nova Curta-Metragem
                </Link>
              </Button>
            </div>
          </div>

          {/* Conteúdo dos curtas-metragens será implementado aqui */}
          <div className="text-center py-12 text-muted-foreground">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10 mb-4">
                <Clapperboard className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Curtas-Metragens</h3>
                <p className="text-sm text-muted-foreground">
                  Filmes com duração inferior a 40 minutos, incluindo animações,
                  documentários curtos e experiências cinematográficas breves.
                </p>
              </div>
              <p>Lista de curtas-metragens será implementada em breve</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
