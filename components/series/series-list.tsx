// components/series/series-list.tsx
"use client";

import { useState, useEffect } from "react";
import { Series, SeriesStatus } from "@/lib/types/database";
import { SeriesCard } from "./series-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Grid3X3, List, Plus, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@supabase/supabase-js";

interface SeriesWithStats extends Series {
  stats: {
    total_episodes: number;
    watched_episodes: number;
    total_seasons: number;
    watched_seasons: number;
    completion_percentage: number;
    average_rating?: number;
  };
}

interface SeriesListProps {
  series: SeriesWithStats[];
  statusCounts: {
    all: number;
    in_progress: number;
    completed: number;
    abandoned: number;
    planned: number;
  };
  user: User;
}

export function SeriesList({ series, statusCounts, user }: SeriesListProps) {
  const [filteredSeries, setFilteredSeries] = useState(series);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SeriesStatus | "all">("all");
  const [sortBy, setSortBy] = useState<
    "name" | "recent" | "progress" | "rating"
  >("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and sort series
  useEffect(() => {
    let result = [...series];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "progress":
          return b.stats.completion_percentage - a.stats.completion_percentage;
        case "rating":
          const ratingA = a.stats.average_rating || 0;
          const ratingB = b.stats.average_rating || 0;
          return ratingB - ratingA;
        case "recent":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredSeries(result);
  }, [series, searchQuery, statusFilter, sortBy]);

  const statusOptions = [
    { value: "all", label: "Todas", count: statusCounts.all },
    {
      value: "in_progress",
      label: "Em Progresso",
      count: statusCounts.in_progress,
    },
    { value: "completed", label: "Completadas", count: statusCounts.completed },
    { value: "abandoned", label: "Abandonadas", count: statusCounts.abandoned },
    { value: "planned", label: "Planeadas", count: statusCounts.planned },
  ];

  const sortOptions = [
    { value: "recent", label: "Mais Recentes" },
    { value: "name", label: "Nome A-Z" },
    { value: "progress", label: "Progresso" },
    { value: "rating", label: "Avaliação" },
  ];

  if (series.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Film className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Nenhuma série encontrada</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Comece adicionando sua primeira série para acompanhar seu progresso
        </p>
        <Button className="mt-6" asChild>
          <a href="/series/new">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeira Série
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar séries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Filter Chips */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(option.value as any)}
              className="whitespace-nowrap"
            >
              {option.label}
              <Badge variant="secondary" className="ml-2">
                {option.count}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredSeries.length} de {series.length} séries
      </div>

      {/* Series Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeries.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              viewMode={viewMode}
              user={user}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSeries.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              viewMode={viewMode}
              user={user}
            />
          ))}
        </div>
      )}
    </div>
  );
}
