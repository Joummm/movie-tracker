// components/series/SeriesDetailView.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Tv, Users, BarChart3, ChevronLeft } from "lucide-react";
import { SeriesHeader } from "./SeriesHeader";
import { SeriesSeasons } from "./SeriesSeasons";
import { SeriesCast } from "./SeriesCast";
import { SeriesWithStats } from "@/lib/types/series";
import { User } from "@supabase/supabase-js";

interface SeriesDetailViewProps {
  series: SeriesWithStats & {
    seasons?: any[];
    cast?: any[];
  };
  user: User;
}

export function SeriesDetailView({ series, user }: SeriesDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  return (
    <div className="space-y-8">
      {/* Series Header */}
      <SeriesHeader series={series} user={user} />

      {/* Main Content with Tabs */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border/30">
            <TabsList className="h-14 px-6 bg-transparent rounded-none w-full justify-start gap-1">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all"
              >
                <Info className="h-4 w-4" />
                <span>Visão Geral</span>
              </TabsTrigger>

              <TabsTrigger
                value="seasons"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all"
              >
                <Tv className="h-4 w-4" />
                <span>Temporadas</span>
              </TabsTrigger>

              <TabsTrigger
                value="cast"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all"
              >
                <Users className="h-4 w-4" />
                <span>Elenco</span>
              </TabsTrigger>

              <TabsTrigger
                value="stats"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Estatísticas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="space-y-6">
                {/* Description Section */}
                {series.description && (
                  <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-6">
                    <h3 className="font-semibold text-lg mb-4">
                      Sobre a Série
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {series.description}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Series Info */}
                  <div className="bg-linear-to-br from-primary/5 to-blue-500/5 rounded-xl border border-border/30 p-6">
                    <h3 className="font-semibold text-lg mb-4">
                      Informações da Série
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ano de Lançamento
                        </p>
                        <p className="font-medium">
                          {series.release_year || "Não especificado"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Período</p>
                        <p className="font-medium">
                          {series.start_date
                            ? formatDate(series.start_date)
                            : "?"}
                          {" - "}
                          {series.end_date ? formatDate(series.end_date) : "?"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Duração Total
                        </p>
                        <p className="font-medium">
                          {Math.round(series.stats.total_watch_time / 60)}h
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Temporadas
                        </p>
                        <p className="font-medium">
                          {series.stats.total_seasons} (
                          {series.stats.watched_seasons} completas)
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Episódios
                        </p>
                        <p className="font-medium">
                          {series.stats.total_episodes} (
                          {series.stats.watched_episodes} assistidos)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-linear-to-br from-muted/20 to-muted/10 rounded-xl border border-border/30 p-6">
                    <h3 className="font-semibold text-lg mb-4">
                      Informações Adicionais
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">
                          {series.status.replace("_", " ")}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Criada em
                        </p>
                        <p className="font-medium">
                          {new Date(series.created_at).toLocaleDateString(
                            "pt-PT",
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Atualizada em
                        </p>
                        <p className="font-medium">
                          {new Date(series.updated_at).toLocaleDateString(
                            "pt-PT",
                          )}
                        </p>
                      </div>

                      {(series.would_recommend !== null ||
                        series.would_rewatch !== null ||
                        series.has_special_seasons) && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Preferências
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {series.would_recommend !== null && (
                              <span
                                className={`px-2 py-1 rounded text-xs ${series.would_recommend ? "bg-emerald-500/20 text-emerald-600" : "bg-rose-500/20 text-rose-600"}`}
                              >
                                {series.would_recommend
                                  ? "✓ Recomendaria"
                                  : "✗ Não recomendaria"}
                              </span>
                            )}
                            {series.would_rewatch !== null && (
                              <span
                                className={`px-2 py-1 rounded text-xs ${series.would_rewatch ? "bg-emerald-500/20 text-emerald-600" : "bg-rose-500/20 text-rose-600"}`}
                              >
                                {series.would_rewatch
                                  ? "✓ Assistiria novamente"
                                  : "✗ Não assistiria novamente"}
                              </span>
                            )}
                            {series.has_special_seasons && (
                              <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-600">
                                Tem temporadas especiais
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Seasons Tab */}
            <TabsContent value="seasons" className="m-0">
              <SeriesSeasons
                seriesId={series.id}
                seasons={series.seasons || []}
                userId={user.id}
              />
            </TabsContent>

            {/* Cast Tab */}
            <TabsContent value="cast" className="m-0">
              <SeriesCast cast={series.cast || []} seriesId={series.id} />
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="m-0">
              <div className="space-y-6">
                {/* Main Stats Card */}
                <div className="bg-linear-to-br from-card to-card/80 rounded-xl border border-border/30 p-6">
                  <h3 className="font-semibold text-lg mb-6">
                    Estatísticas Detalhadas
                  </h3>

                  <div className="space-y-6">
                    {/* Progress Summary */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          Progresso Total
                        </span>
                        <span className="font-semibold text-primary">
                          {series.stats.completion_percentage}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-blue-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${series.stats.completion_percentage}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{series.stats.watched_episodes} assistidos</span>
                        <span>
                          {series.stats.total_episodes -
                            series.stats.watched_episodes}{" "}
                          restantes
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Tv className="h-4 w-4" />
                          <span>Temporadas</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {series.stats.watched_seasons}/
                          {series.stats.total_seasons}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {series.stats.total_seasons -
                            series.stats.watched_seasons}{" "}
                          restantes
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BarChart3 className="h-4 w-4" />
                          <span>Horas Totais</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {Math.round(series.stats.total_watch_time / 60)}h
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {series.stats.watched_episodes > 0
                            ? `~${Math.round(series.stats.total_watch_time / series.stats.watched_episodes)}min/ep`
                            : "0min/ep"}
                        </div>
                      </div>

                      {series.stats.average_rating && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-amber-500">★</span>
                            <span>Avaliação</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {series.stats.average_rating.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            de 10
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-emerald-500">✓</span>
                          <span>Velocidade</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {series.stats.total_episodes > 0
                            ? `${((series.stats.watched_episodes / series.stats.total_episodes) * 100).toFixed(0)}%`
                            : "0%"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          taxa de conclusão
                        </div>
                      </div>
                    </div>

                    {/* Season Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          Temporadas Concluídas
                        </span>
                        <span className="font-semibold">
                          {series.stats.total_seasons > 0
                            ? `${Math.round((series.stats.watched_seasons / series.stats.total_seasons) * 100)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-700"
                          style={{
                            width:
                              series.stats.total_seasons > 0
                                ? `${(series.stats.watched_seasons / series.stats.total_seasons) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
