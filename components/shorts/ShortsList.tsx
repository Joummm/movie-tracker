// components/shorts/ShortsList.tsx
"use client";

import { useState, useEffect } from "react";
import { ShortCard } from "./ShortCard";
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
  Clapperboard,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ShortWithStats } from "@/lib/types/shorts";
import { useRouter, useSearchParams } from "next/navigation";

interface ShortsListProps {
  shorts: ShortWithStats[];
  user: SupabaseUser;
}

export function ShortsList({ shorts, user }: ShortsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filteredShorts, setFilteredShorts] =
    useState<ShortWithStats[]>(shorts);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);

  // Extrair anos únicos para filtro
  const uniqueYears = [
    ...new Set(
      shorts
        .map((s) => s.release_year)
        .filter(
          (year): year is number => typeof year === "number" && !isNaN(year),
        )
        .sort((a, b) => b - a),
    ),
  ];

  // Extrair tipos únicos para filtro
  const uniqueTypes = [
    ...new Set(
      shorts
        .map((s) => s.short_type)
        .filter((type): type is string => Boolean(type)),
    ),
  ];

  // Status options
  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "completed", label: "Assistidos", color: "bg-emerald-500" },
    { value: "watching", label: "Assistindo", color: "bg-blue-500" },
    { value: "planned", label: "Planejados", color: "bg-amber-500" },
    { value: "rewatching", label: "Reassistindo", color: "bg-purple-500" },
    { value: "abandoned", label: "Abandonados", color: "bg-rose-500" },
  ];

  // Type options
  const typeOptions = [
    { value: "all", label: "Todos os tipos" },
    ...uniqueTypes.map((type) => ({
      value: type,
      label:
        type === "animation"
          ? "Animação"
          : type === "live_action"
            ? "Live Action"
            : type === "documentary"
              ? "Documentário"
              : type === "experimental"
                ? "Experimental"
                : type,
    })),
  ];

  // Sort options
  const sortOptions = [
    { value: "recent", label: "Mais Recentes", icon: Calendar },
    { value: "rating", label: "Melhor Avaliados", icon: Star },
    { value: "name", label: "Nome A-Z", icon: Clapperboard },
    { value: "year", label: "Ano (Novo → Velho)", icon: Calendar },
    { value: "year_old", label: "Ano (Velho → Novo)", icon: Calendar },
    { value: "duration", label: "Duração", icon: Clock },
    { value: "watch_date", label: "Data de Visualização", icon: Calendar },
  ];

  // Aplicar filtros
  useEffect(() => {
    let result = [...shorts];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (short) =>
          short.name?.toLowerCase().includes(query) ||
          (short as any).director?.toLowerCase().includes(query) ||
          (short as any).studio?.toLowerCase().includes(query) ||
          (short as any).country?.toLowerCase().includes(query),
      );
    }

    // Filtro por status
    if (statusFilter !== "all") {
      result = result.filter((short) => short.watch_status === statusFilter);
    }

    // Filtro por ano
    if (yearFilter !== "all") {
      const year = parseInt(yearFilter);
      result = result.filter((short) => short.release_year === year);
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      result = result.filter((short) => short.short_type === typeFilter);
    }

    // Ordenação
    result.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "year":
          return (b.release_year || 0) - (a.release_year || 0);
        case "year_old":
          return (a.release_year || 0) - (b.release_year || 0);
        case "duration":
          return (b.duration || 0) - (a.duration || 0);
        case "watch_date":
          const dateA = a.watched_date ? new Date(a.watched_date).getTime() : 0;
          const dateB = b.watched_date ? new Date(b.watched_date).getTime() : 0;
          return dateB - dateA;
        case "recent":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredShorts(result);
  }, [shorts, searchQuery, statusFilter, yearFilter, typeFilter, sortBy]);

  // Atualizar URL com filtros
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (yearFilter !== "all") params.set("year", yearFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);

    router.push(`/shorts?${params.toString()}`);
  };

  // Verifica se há shorts sem ID
  const validShorts = shorts.filter((short) => short.id);
  if (validShorts.length !== shorts.length) {
    console.error(
      `Encontrados ${shorts.length - validShorts.length} shorts sem ID`,
    );
  }

  if (validShorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-6 shadow-lg">
          <Clapperboard className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold bg-linear-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent mb-2">
          Sua coleção está vazia
        </h3>
        <p className="text-muted-foreground mt-2 max-w-md text-lg">
          Comece adicionando seu primeiro curta-metragem para criar sua coleção
          de experiências cinematográficas breves
        </p>
        <Button className="mt-8 gap-2" size="lg" asChild>
          <a href="/shorts/new">
            <Plus className="h-5 w-5" />
            Adicionar Primeiro Curta
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-sm py-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar curtas, diretores, estúdios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateUrl()}
                className="pl-10 h-12 text-base rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl border overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-10 w-10 rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-10 w-10 rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.color && (
                        <div
                          className={`h-2 w-2 rounded-full ${option.color}`}
                        />
                      )}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Filter */}
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32 h-10">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 h-10">
                <Clapperboard className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 h-10">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <ScrollArea className="w-full whitespace-nowrap mt-4">
          <div className="flex gap-2 pb-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className="whitespace-nowrap gap-2 h-8"
              >
                {option.color && (
                  <div className={`h-2 w-2 rounded-full ${option.color}`} />
                )}
                {option.label}
                <Badge variant="secondary" className="ml-1">
                  {
                    validShorts.filter(
                      (s) =>
                        option.value === "all" ||
                        s.watch_status === option.value,
                    ).length
                  }
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-semibold text-foreground">
            {filteredShorts.length}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-foreground">
            {validShorts.length}
          </span>{" "}
          curtas
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredShorts.length > 0 && (
            <span>
              Duração total:{" "}
              <span className="font-semibold text-foreground">
                {Math.round(
                  filteredShorts.reduce(
                    (sum, s) => sum + (s.duration || 0),
                    0,
                  ) / 60,
                )}
                h
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Shorts Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredShorts
            .filter((short) => short.id)
            .map((short) => (
              <ShortCard
                key={short.id}
                short={short}
                viewMode={viewMode}
                user={user}
              />
            ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredShorts
            .filter((short) => short.id) // Filtra apenas shorts com ID
            .map((short) => (
              <ShortCard
                key={short.id}
                short={short}
                viewMode={viewMode}
                user={user}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {filteredShorts.length === 0 && (
        <div className="text-center py-12">
          <Clapperboard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Nenhum curta encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar seus filtros de busca
          </p>
        </div>
      )}
    </div>
  );
}
