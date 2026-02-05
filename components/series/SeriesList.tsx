// components/series/series-list.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { SeriesCard } from "./SeriesCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  Film,
  Tv,
  Rows,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import { SeriesWithStats, StatusCounts } from "@/lib/types/series";
import { useRouter } from "next/navigation";

interface SeriesListProps {
  series: SeriesWithStats[];
  statusCounts: StatusCounts;
  user: User;
}

export function SeriesList({ series, statusCounts, user }: SeriesListProps) {
  const router = useRouter();
  const [filteredSeries, setFilteredSeries] =
    useState<SeriesWithStats[]>(series);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Opções de filtros
  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Todos Status", count: statusCounts.all },
      {
        value: "in_progress",
        label: "Em Progresso",
        count: statusCounts.in_progress,
      },
      {
        value: "completed",
        label: "Completadas",
        count: statusCounts.completed,
      },
      {
        value: "abandoned",
        label: "Abandonadas",
        count: statusCounts.abandoned,
      },
    ],
    [statusCounts],
  );

  const progressOptions = [
    { value: "all", label: "Qualquer progresso" },
    { value: "not_started", label: "Não iniciadas (0%)" },
    { value: "in_progress_low", label: "Iniciadas (1-25%)" },
    { value: "in_progress_medium", label: "Em andamento (26-75%)" },
    { value: "in_progress_high", label: "Quase completas (76-99%)" },
    { value: "completed", label: "Completas (100%)" },
  ];

  const ratingOptions = [
    { value: "all", label: "Qualquer avaliação" },
    { value: "6", label: "⭐ 6+ estrelas" },
    { value: "7", label: "⭐⭐ 7+ estrelas" },
    { value: "8", label: "⭐⭐⭐ 8+ estrelas" },
    { value: "9", label: "⭐⭐⭐⭐ 9+ estrelas" },
  ];

  const seasonOptions = [
    { value: "all", label: "Qualquer temporada" },
    { value: "1", label: "1 Temporada" },
    { value: "2-3", label: "2-3 Temporadas" },
    { value: "4-6", label: "4-6 Temporadas" },
    { value: "7+", label: "7+ Temporadas" },
  ];

  const sortOptions = [
    { value: "recent", label: "Mais Recentes" },
    { value: "name_asc", label: "Nome (A-Z)" },
    { value: "name_desc", label: "Nome (Z-A)" },
    { value: "rating", label: "Melhor Avaliadas" },
    { value: "progress", label: "Progresso (%)" },
    { value: "year_desc", label: "Ano (Novo → Antigo)" },
    { value: "year_asc", label: "Ano (Antigo → Novo)" },
    { value: "watch_time", label: "Tempo Assistido" },
  ];

  // Extrair anos únicos
  const uniqueYears = useMemo(() => {
    const years = series
      .map((s) => s.release_year)
      .filter(
        (year): year is number =>
          year !== null && year !== undefined && !isNaN(Number(year)),
      )
      .sort((a, b) => b - a);

    return [...new Set(years)];
  }, [series]);

  // Calcular filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (yearFilter !== "all") count++;
    if (ratingFilter !== "all") count++;
    if (seasonFilter !== "all") count++;
    if (progressFilter !== "all") count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [
    statusFilter,
    yearFilter,
    ratingFilter,
    seasonFilter,
    progressFilter,
    searchQuery,
  ]);

  // Aplicar filtros
  useEffect(() => {
    let result = [...series];

    // Busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query),
      );
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Ano
    if (yearFilter !== "all") {
      const year = parseInt(yearFilter);
      if (!isNaN(year)) {
        result = result.filter((s) => s.release_year === year);
      }
    }

    // Avaliação
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      if (!isNaN(minRating)) {
        result = result.filter(
          (s) => (s.stats?.average_rating || 0) >= minRating,
        );
      }
    }

    // Temporadas
    if (seasonFilter !== "all") {
      const totalSeasons = (s: SeriesWithStats) =>
        s.total_seasons || s.seasons?.length || 0;

      switch (seasonFilter) {
        case "1":
          result = result.filter((s) => totalSeasons(s) === 1);
          break;
        case "2-3":
          result = result.filter(
            (s) => totalSeasons(s) >= 2 && totalSeasons(s) <= 3,
          );
          break;
        case "4-6":
          result = result.filter(
            (s) => totalSeasons(s) >= 4 && totalSeasons(s) <= 6,
          );
          break;
        case "7+":
          result = result.filter((s) => totalSeasons(s) >= 7);
          break;
      }
    }

    // Progresso
    if (progressFilter !== "all") {
      const progress = (s: SeriesWithStats) =>
        s.stats?.completion_percentage || 0;

      switch (progressFilter) {
        case "not_started":
          result = result.filter((s) => progress(s) === 0);
          break;
        case "in_progress_low":
          result = result.filter((s) => progress(s) > 0 && progress(s) <= 25);
          break;
        case "in_progress_medium":
          result = result.filter((s) => progress(s) > 25 && progress(s) <= 75);
          break;
        case "in_progress_high":
          result = result.filter((s) => progress(s) > 75 && progress(s) < 100);
          break;
        case "completed":
          result = result.filter((s) => progress(s) === 100);
          break;
      }
    }

    // Ordenação
    result.sort((a, b) => {
      const getValue = {
        name_asc: () => (a.name || "").localeCompare(b.name || ""),
        name_desc: () => (b.name || "").localeCompare(a.name || ""),
        rating: () =>
          (b.stats?.average_rating || 0) - (a.stats?.average_rating || 0),
        progress: () =>
          (b.stats?.completion_percentage || 0) -
          (a.stats?.completion_percentage || 0),
        year_desc: () => (b.release_year || 0) - (a.release_year || 0),
        year_asc: () => (a.release_year || 0) - (b.release_year || 0),
        watch_time: () =>
          (b.stats?.total_watch_hours || 0) - (a.stats?.total_watch_hours || 0),
        recent: () =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      };

      return getValue[sortBy as keyof typeof getValue]?.() || 0;
    });

    setFilteredSeries(result);
  }, [
    series,
    searchQuery,
    statusFilter,
    yearFilter,
    ratingFilter,
    seasonFilter,
    progressFilter,
    sortBy,
  ]);

  const handleStatusChange = () => {
    router.refresh();
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setYearFilter("all");
    setRatingFilter("all");
    setSeasonFilter("all");
    setProgressFilter("all");
  };

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
      {/* Barra Superior - Busca, Vista e Ordenação */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Busca */}
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar séries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Controles Direita */}
        <div className="flex items-center gap-2">
          {/* Modo de Vista */}
          <div className="flex rounded-lg border bg-muted/20">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 px-3"
              title="Grade"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 px-3"
              title="Lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className="h-9 px-3"
              title="Compacta"
            >
              <Rows className="h-4 w-4" />
            </Button>
          </div>

          {/* Ordenação */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
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

          {/* Botão Filtros Avançados */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filtros Avançados (Expandível) */}
      {showAdvancedFilters && (
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filtros Avançados</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Tudo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Ano */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano de Lançamento</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {uniqueYears.slice(0, 10).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Progresso */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Progresso</label>
              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {progressOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Avaliação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Avaliação Mínima</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro Temporadas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nº de Temporadas</label>
              <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Rápidos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Rápidos</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.slice(1).map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      statusFilter === option.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter(option.value)}
                    className="h-8"
                  >
                    {option.label}
                    <Badge variant="secondary" className="ml-1">
                      {option.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo dos Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 rounded-lg">
          <span className="text-sm font-medium">Filtros ativos:</span>
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {statusOptions.find((o) => o.value === statusFilter)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setStatusFilter("all")}
              />
            </Badge>
          )}
          {yearFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Ano: {yearFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setYearFilter("all")}
              />
            </Badge>
          )}
          {ratingFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {ratingFilter}+
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setRatingFilter("all")}
              />
            </Badge>
          )}
          {seasonFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Temp: {seasonFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSeasonFilter("all")}
              />
            </Badge>
          )}
          {progressFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {progressOptions.find((o) => o.value === progressFilter)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setProgressFilter("all")}
              />
            </Badge>
          )}
          {searchQuery.trim() && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{searchQuery}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearchQuery("")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Contador de Resultados */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          Mostrando <span className="font-medium">{filteredSeries.length}</span>{" "}
          de <span className="font-medium">{series.length}</span> séries
          {activeFiltersCount > 0 && (
            <span className="text-muted-foreground ml-2">
              ({activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""}{" "}
              ativo{activeFiltersCount !== 1 ? "s" : ""})
            </span>
          )}
        </div>
      </div>

      {/* Grid/Lista/Compact de Séries */}
      {filteredSeries.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSeries.map((series) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  viewMode={viewMode}
                  user={user}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-4">
              {filteredSeries.map((series) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  viewMode={viewMode}
                  user={user}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSeries.map((series) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  viewMode={viewMode}
                  user={user}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Tv className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Nenhuma série encontrada
          </h3>
          <p className="text-muted-foreground mb-4">
            Nenhuma série corresponde aos filtros aplicados
          </p>
          <Button variant="outline" onClick={clearAllFilters} className="gap-2">
            <Filter className="h-3 w-3" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
