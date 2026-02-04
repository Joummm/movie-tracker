// components/series/series-list.tsx
"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Star,
  Tv,
  Rows,
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
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");

  // Extrair valores únicos para filtros - COM PROTEÇÃO CONTRA VALORES INVÁLIDOS
  const uniqueYears = [
    ...new Set(
      series
        .map((s) => s.release_year)
        .filter(
          (year): year is number =>
            year !== null &&
            year !== undefined &&
            !isNaN(Number(year)) &&
            typeof year === "number",
        )
        .sort((a, b) => b - a),
    ),
  ];

  const uniqueSeasons = [
    ...new Set(
      series
        .map((s) => s.total_seasons || s.seasons?.length || 0)
        .filter(
          (seasons): seasons is number =>
            seasons !== null && seasons !== undefined && seasons > 0,
        )
        .sort((a, b) => a - b),
    ),
  ];

  // Função para atualizar a lista quando o status mudar
  const handleStatusChange = () => {
    router.refresh();
  };

  // Filter and sort series
  useEffect(() => {
    let result = [...series];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Apply year filter
    if (yearFilter !== "all") {
      const year = parseInt(yearFilter);
      if (!isNaN(year)) {
        result = result.filter((s) => s.release_year === year);
      }
    }

    // Apply rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      if (!isNaN(minRating)) {
        result = result.filter(
          (s) => (s.stats?.average_rating || 0) >= minRating,
        );
      }
    }

    // Apply season filter
    if (seasonFilter !== "all") {
      const seasons = parseInt(seasonFilter);
      if (!isNaN(seasons)) {
        if (seasons === 1) {
          result = result.filter(
            (s) => (s.total_seasons || s.seasons?.length || 0) === 1,
          );
        } else if (seasons === 2) {
          result = result.filter((s) => {
            const totalSeasons = s.total_seasons || s.seasons?.length || 0;
            return totalSeasons >= 2 && totalSeasons <= 4;
          });
        } else if (seasons === 5) {
          result = result.filter(
            (s) => (s.total_seasons || s.seasons?.length || 0) >= 5,
          );
        }
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      const aName = a.name || "";
      const bName = b.name || "";
      const aYear = a.release_year || 0;
      const bYear = b.release_year || 0;
      const aRating = a.stats?.average_rating || 0;
      const bRating = b.stats?.average_rating || 0;
      const aProgress = a.stats?.completion_percentage || 0;
      const bProgress = b.stats?.completion_percentage || 0;
      const aEpisodes = a.stats?.total_episodes || 0;
      const bEpisodes = b.stats?.total_episodes || 0;
      const aWatchHours = a.stats?.total_watch_hours || 0;
      const bWatchHours = b.stats?.total_watch_hours || 0;

      switch (sortBy) {
        case "name":
          return aName.localeCompare(bName);
        case "name_desc":
          return bName.localeCompare(aName);
        case "progress":
          return bProgress - aProgress;
        case "rating":
          return bRating - aRating;
        case "year":
          return bYear - aYear;
        case "year_old":
          return aYear - bYear;
        case "episodes":
          return bEpisodes - aEpisodes;
        case "watch_time":
          return bWatchHours - aWatchHours;
        case "recent":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredSeries(result);
  }, [
    series,
    searchQuery,
    statusFilter,
    yearFilter,
    ratingFilter,
    seasonFilter,
    sortBy,
  ]);

  // Opções de status
  const statusOptions = [
    { value: "all", label: "Todas", count: statusCounts.all },
    {
      value: "in_progress",
      label: "Em Progresso",
      count: statusCounts.in_progress,
    },
    { value: "completed", label: "Completadas", count: statusCounts.completed },
    { value: "abandoned", label: "Abandonadas", count: statusCounts.abandoned },
    // COMENTADO: Status "planned" está desativado no momento
    // { value: "planned", label: "Planejadas", count: statusCounts.planned },
  ];

  const ratingOptions = [
    { value: "all", label: "Qualquer avaliação" },
    { value: "7", label: "7+ Estrelas" },
    { value: "8", label: "8+ Estrelas" },
    { value: "9", label: "9+ Estrelas" },
  ];

  const seasonOptions = [
    { value: "all", label: "Qualquer temporada" },
    { value: "1", label: "1 Temporada" },
    { value: "2", label: "2-4 Temporadas" },
    { value: "5", label: "5+ Temporadas" },
  ];

  const sortOptions = [
    { value: "recent", label: "Mais Recentes", icon: Calendar },
    { value: "name", label: "Nome A-Z", icon: Tv },
    { value: "name_desc", label: "Nome Z-A", icon: Tv },
    { value: "rating", label: "Melhor Avaliadas", icon: Star },
    { value: "progress", label: "Progresso", icon: Filter },
    { value: "year", label: "Ano (Novo)", icon: Calendar },
    { value: "year_old", label: "Ano (Antigo)", icon: Calendar },
    { value: "episodes", label: "Mais Episódios", icon: Tv },
    { value: "watch_time", label: "Mais Tempo", icon: Calendar },
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
      {/* Primeira Linha - Busca, Vista e Ordenação */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar séries, descrição, gênero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border bg-muted/20">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 px-3"
              title="Vista em grade"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 px-3"
              title="Vista em lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className="h-9 px-3"
              title="Vista compacta"
            >
              <Rows className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon && <option.icon className="h-4 w-4" />}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Segunda Linha - Filtros Avançados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
        {/* Filtro de Status */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between ">
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

        {/* Filtro de Ano */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ano</label>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {uniqueYears.slice(0, 8).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Temporadas */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Temporadas</label>
          <Select value={seasonFilter} onValueChange={setSeasonFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Nº de temporadas" />
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

        {/* Filtro de Avaliação */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Avaliação</label>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Avaliação mínima" />
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
        {/* Status Rápido */}
        <div className="space-y-4 md:space-y-2">
          <label className="text-sm font-medium">Status Rápido</label>
          <div className="flex items-center gap-2 ">
            {statusOptions.slice(1).map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className="whitespace-nowrap h-8 px-2.5 flex items-center gap-1"
              >
                <span className="text-xs">{option.label}</span>
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs h-5 px-1 min-w-6"
                >
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Terceira Linha  */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredSeries.length} de {series.length} séries
          {statusFilter !== "all" &&
            ` • ${statusOptions.find((o) => o.value === statusFilter)?.label}`}
          {yearFilter !== "all" && ` • ${yearFilter}`}
          {ratingFilter !== "all" && ` • ${ratingFilter}+ estrelas`}
          {seasonFilter !== "all" &&
            ` • ${seasonOptions.find((o) => o.value === seasonFilter)?.label}`}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setYearFilter("all");
            setRatingFilter("all");
            setSeasonFilter("all");
            setSortBy("recent");
          }}
          className="gap-2"
        >
          <Filter className="h-3 w-3" />
          Limpar Filtros
        </Button>
      </div>

      {/* Series Grid/List/Compact */}
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

      {/* Empty State */}
      {filteredSeries.length === 0 && (
        <div className="text-center py-12">
          <Tv className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Nenhuma série encontrada
          </h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar seus filtros de busca ou limpar os filtros atuais
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setYearFilter("all");
              setRatingFilter("all");
              setSeasonFilter("all");
            }}
            className="gap-2"
          >
            <Filter className="h-3 w-3" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
