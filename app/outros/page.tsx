// app/others/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Plus, Monitor, Calendar, Clock, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OthersList } from "@/components/others/OthersList";

// Função para buscar dados dos outros conteúdos
async function fetchOthersData(userId: string) {
  const supabase = await createClient();

  // Buscar todos os conteúdos do tipo "other"
  const { data: contents } = await supabase
    .from("content")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "other")
    .order("created_at", { ascending: false });

  // Para cada conteúdo, buscar estatísticas adicionais
  const contentsWithStats = await Promise.all(
    (contents || []).map(async (content) => {
      // Buscar viewings (reassistidas)
      const { data: viewings } = await supabase
        .from("content_viewings")
        .select("*")
        .eq("content_id", content.id)
        .order("watched_date", { ascending: false });

      // Buscar atores
      const { data: actors } = await supabase
        .from("content_actors")
        .select("*, actor:actors(*)")
        .eq("content_id", content.id)
        .order("credit_order", { ascending: true });

      // Buscar gêneros
      const { data: genres } = await supabase
        .from("content_genres")
        .select("*, genre:genres(*)")
        .eq("content_id", content.id);

      // Calcular estatísticas
      const watchCount = viewings?.length || (content.watched_date ? 1 : 0);
      const totalWatchTime = (content.duration || 0) * watchCount;
      const averageRating = content.rating || 0;
      const rewatchCount = Math.max(0, watchCount - 1);

      const watchDates =
        viewings?.map((v) => v.watched_date).filter(Boolean) || [];
      if (content.watched_date) watchDates.push(content.watched_date);

      const sortedDates = watchDates.sort();
      const firstWatched = sortedDates[0];
      const lastWatched = sortedDates[sortedDates.length - 1];

      let daysSinceLastWatch: number | undefined;
      if (lastWatched) {
        const lastWatchedDate = new Date(lastWatched);
        const today = new Date();
        daysSinceLastWatch = Math.floor(
          (today.getTime() - lastWatchedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      return {
        ...content,
        stats: {
          watch_count: watchCount,
          total_watch_time: totalWatchTime,
          average_rating: averageRating,
          rewatch_count: rewatchCount,
          first_watched: firstWatched,
          last_watched: lastWatched,
          days_since_last_watch: daysSinceLastWatch,
        },
        actors: actors || [],
        genres: genres || [],
        viewings: viewings || [],
      };
    }),
  );

  return contentsWithStats;
}

// Componente para estatísticas
function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  progress,
}: any) {
  return (
    <div className="bg-linear-to-br from-card to-card/80 rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}/10`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <Badge variant="outline" className="text-xs">
          {title}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {progress !== undefined && (
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full bg-linear-to-r ${color} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}
    </div>
  );
}

export default async function OthersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  // IMPORTANTE: Em Next.js 15, searchParams é uma Promise
  const resolvedSearchParams = await searchParams;

  // Buscar dados dos outros conteúdos
  const contents = await fetchOthersData(user.id);

  // Calcular estatísticas em tempo real
  const totalContents = contents.length;
  const totalWatchTime = contents.reduce(
    (sum, c) => sum + (c.duration || 0),
    0,
  );
  const watchedContents = contents.filter(
    (c) => c.watch_status === "completed",
  ).length;
  const averageRating =
    contents.length > 0
      ? contents.reduce((sum, c) => sum + (c.rating || 0), 0) / contents.length
      : 0;

  const averageDuration =
    contents.length > 0 ? Math.round(totalWatchTime / contents.length) : 0;

  // Extrair tipos de conteúdo baseados nos nomes
  const extractContentType = (name?: string) => {
    if (!name) return "Outro";

    const nameLower = name.toLowerCase();
    if (
      nameLower.includes("documentário") ||
      nameLower.includes("documentario")
    )
      return "Documentário";
    if (nameLower.includes("especial")) return "Especial";
    if (nameLower.includes("educativo")) return "Educativo";
    if (nameLower.includes("gameplay") || nameLower.includes("jogo"))
      return "Gameplay";
    if (nameLower.includes("noticiário") || nameLower.includes("noticias"))
      return "Noticiário";
    if (nameLower.includes("tecnologia") || nameLower.includes("tech"))
      return "Tecnologia";
    if (nameLower.includes("ciência") || nameLower.includes("ciencia"))
      return "Ciência";
    if (nameLower.includes("natureza")) return "Natureza";
    if (nameLower.includes("viagem")) return "Viagem";
    if (nameLower.includes("culinária") || nameLower.includes("culinaria"))
      return "Culinária";
    if (nameLower.includes("esporte")) return "Esportes";
    if (nameLower.includes("música") || nameLower.includes("musica"))
      return "Música";
    if (nameLower.includes("arte")) return "Arte";
    if (nameLower.includes("história") || nameLower.includes("historia"))
      return "História";
    if (nameLower.includes("política") || nameLower.includes("politica"))
      return "Política";
    if (nameLower.includes("entretenimento")) return "Entretenimento";
    return "Outro";
  };

  // Agrupar por tipo
  const contentTypes = [
    {
      name: "Documentário",
      count: contents.filter(
        (c) => extractContentType(c.name) === "Documentário",
      ).length,
    },
    {
      name: "Especial",
      count: contents.filter((c) => extractContentType(c.name) === "Especial")
        .length,
    },
    {
      name: "Educativo",
      count: contents.filter((c) => extractContentType(c.name) === "Educativo")
        .length,
    },
    {
      name: "Gameplay",
      count: contents.filter((c) => extractContentType(c.name) === "Gameplay")
        .length,
    },
    {
      name: "Noticiário",
      count: contents.filter((c) => extractContentType(c.name) === "Noticiário")
        .length,
    },
    {
      name: "Tecnologia",
      count: contents.filter((c) => extractContentType(c.name) === "Tecnologia")
        .length,
    },
    {
      name: "Outro",
      count: contents.filter((c) => extractContentType(c.name) === "Outro")
        .length,
    },
  ].filter((type) => type.count > 0);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName={profile?.display_name || "User"} />

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 shadow-lg">
                  <Monitor className="h-8 w-8 text-indigo-500" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    Outros Conteúdos
                  </h1>
                  <p className="text-muted-foreground mt-1 max-w-2xl">
                    Sua coleção diversificada • {totalContents} itens
                    catalogados
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="gap-2 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-500/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Link href="/outros/new">
                  <Plus className="h-4 w-4" />
                  Novo Conteúdo
                </Link>
              </Button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={Monitor}
              title="Total"
              subtitle="Conteúdos"
              value={totalContents}
              color="text-indigo-500"
              progress={
                totalContents > 0
                  ? Math.round(
                      Math.min((watchedContents / totalContents) * 100, 100),
                    )
                  : 0
              }
            />

            <StatsCard
              icon={Clock}
              title="Tempo"
              subtitle="Horas Assistidas"
              value={`${Math.round(totalWatchTime / 60)}h`}
              color="text-blue-500"
              progress={Math.round(
                Math.min((totalWatchTime / (totalContents * 120)) * 100, 100),
              )}
            />

            <StatsCard
              icon={Star}
              title="Avaliação"
              subtitle="Média Geral"
              value={averageRating.toFixed(1)}
              color="text-yellow-500"
              progress={Math.round((averageRating / 10) * 100)}
            />

            <StatsCard
              icon={Calendar}
              title="Duração"
              subtitle="Média por Conteúdo"
              value={`${averageDuration}m`}
              color="text-purple-500"
              progress={Math.round(
                Math.min((averageDuration / 120) * 100, 100),
              )}
            />
          </div>

          {/* Content Types Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Type Distribution */}
            <div className="bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                Tipos de Conteúdo
              </h3>
              <div className="space-y-4">
                {contentTypes.map((type) => (
                  <div key={type.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{type.name}</span>
                      <span className="text-sm font-medium">{type.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${totalContents > 0 ? (type.count / totalContents) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Rated Contents */}
            <div className="bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                Melhor Avaliados
              </h3>
              <div className="space-y-4">
                {contents
                  .filter((c) => c.rating && c.rating >= 8)
                  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                  .slice(0, 3)
                  .map((content) => (
                    <Link
                      key={content.id}
                      href={`/outros/${content.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-300 group"
                    >
                      {content.cover_image ? (
                        <img
                          src={content.cover_image}
                          alt={content.name || "Conteúdo sem nome"}
                          className="h-12 w-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                          <Monitor className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-indigo-500 transition-colors">
                          {content.name || "Conteúdo sem nome"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">
                              {content.rating?.toFixed(1)}
                            </span>
                          </div>
                          {content.release_year && (
                            <span className="text-xs text-muted-foreground">
                              • {content.release_year}
                            </span>
                          )}
                          {content.duration && (
                            <span className="text-xs text-muted-foreground">
                              • {content.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      </div>
                    </Link>
                  ))}
                {contents.filter((c) => c.rating && c.rating >= 8).length ===
                  0 && (
                  <p className="text-muted-foreground text-sm">
                    Nenhum conteúdo altamente avaliado ainda
                  </p>
                )}
              </div>
            </div>

            {/* Recent Contents */}
            <div className="bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Adicionados Recentemente
              </h3>
              <div className="space-y-4">
                {contents.slice(0, 3).map((content) => (
                  <Link
                    key={content.id}
                    href={`/outros/${content.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-300 group"
                  >
                    {content.cover_image ? (
                      <img
                        src={content.cover_image}
                        alt={content.name || "Conteúdo sem nome"}
                        className="h-12 w-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                        <Monitor className="h-5 w-5 text-muted-foreground group-hover:text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-blue-500 transition-colors">
                        {content.name || "Conteúdo sem nome"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(content.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                        {content.watched_date && (
                          <Badge variant="outline" className="text-xs">
                            Assistido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contents List Component */}
          <OthersList contents={contents} user={user} />
        </div>
      </main>
    </div>
  );
}
