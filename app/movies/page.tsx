// app/movies/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Film, Plus } from "lucide-react";
import Link from "next/link";

export default async function MoviesPage() {
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
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Film className="h-6 w-6 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Meus Filmes
                </h1>
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Acompanhe todos os seus filmes assistidos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="gap-2 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-500/90 hover:to-green-600/90"
              >
                <Link href="/movies/new">
                  <Plus className="h-4 w-4" />
                  Novo Filme
                </Link>
              </Button>
            </div>
          </div>

          {/* Conteúdo dos filmes será implementado aqui */}
          <div className="text-center py-12 text-muted-foreground">
            <p>Lista de filmes será implementada em breve</p>
          </div>
        </div>
      </main>
    </div>
  );
}
