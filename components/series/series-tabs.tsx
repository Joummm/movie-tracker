// components/series/series-tabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Info, 
  Tv, 
  Users, 
  BarChart3, 
  Calendar,
  Star,
  List
} from "lucide-react";
import { useState } from "react";
import { SeriesOverview } from "./series-overview";
import { SeriesSeasons } from "./series-seasons";
import { SeriesCast } from "./series-cast";
import { SeriesDetails } from "./series-details";
import { SeriesStatistics } from "./series-statistics";

interface SeriesTabsProps {
  seriesId: string;
  seriesData: any;
  seasons: any[];
  cast: any[];
  stats: any;
}

export function SeriesTabs({ 
  seriesId, 
  seriesData, 
  seasons, 
  cast, 
  stats 
}: SeriesTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Visão Geral</span>
        </TabsTrigger>
        <TabsTrigger value="seasons" className="flex items-center gap-2">
          <Tv className="h-4 w-4" />
          <span className="hidden sm:inline">Temporadas</span>
        </TabsTrigger>
        <TabsTrigger value="cast" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Elenco</span>
        </TabsTrigger>
        <TabsTrigger value="episodes" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Episódios</span>
        </TabsTrigger>
        <TabsTrigger value="stats" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Estatísticas</span>
        </TabsTrigger>
        <TabsTrigger value="reviews" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Avaliações</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-4">
        {/* Overview Tab */}
        <TabsContent value="overview" className="m-0">
          <div className="space-y-8">
            <SeriesOverview series={seriesData} />
            <SeriesDetails series={seriesData} />
          </div>
        </TabsContent>

        {/* Seasons Tab */}
        <TabsContent value="seasons" className="m-0">
          <SeriesSeasons 
            seriesId={seriesId} 
            seasons={seasons}
            userId={seriesData.user_id}
          />
        </TabsContent>

        {/* Cast Tab */}
        <TabsContent value="cast" className="m-0">
          <SeriesCast cast={cast} />
        </TabsContent>

        {/* Episodes Tab */}
        <TabsContent value="episodes" className="m-0">
          <div className="text-center py-12 text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Lista de episódios em desenvolvimento</p>
            <p className="text-sm mt-2">
              Aqui serão listados todos os episódios da série organizados por temporada
            </p>
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="m-0">
          <SeriesStatistics stats={stats} />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="m-0">
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Avaliações em desenvolvimento</p>
            <p className="text-sm mt-2">
              Aqui serão exibidas as avaliações e críticas da série
            </p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}