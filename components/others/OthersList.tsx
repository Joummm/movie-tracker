// components/others/OthersList.tsx
"use client";

import { useState, useEffect } from "react";
import { OtherCard } from "./OtherCard";
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
  Monitor,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

interface OthersListProps {
  contents: any[];
  user: SupabaseUser;
}

export function OthersList({ contents, user }: OthersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filteredContents, setFilteredContents] = useState<any[]>(contents);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);

  // Extrair anos únicos para filtro
  const uniqueYears = [
    ...new Set(
      contents
        .map((m) => m.release_year)
        .filter(
          (year): year is number => typeof year === "number" && !isNaN(year),
        )
        .sort((a, b) => b - a),
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

  // Sort options
  const sortOptions = [
    { value: "recent", label: "Mais Recentes", icon: Calendar },
    { value: "rating", label: "Melhor Avaliados", icon: Star },
    { value: "name", label: "Nome A-Z", icon: Monitor },
    { value: "year", label: "Ano (Novo → Velho)", icon: Calendar },
    { value: "year_old", label: "Ano (Velho → Novo)", icon: Calendar },
    { value: "duration", label: "Duração", icon: Clock },
    { value: "watch_date", label: "Data de Visualização", icon: Calendar },
  ];

  // Aplicar filtros
  useEffect(() => {
    let result = [...contents];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((content) =>
        content.name?.toLowerCase().includes(query),
      );
    }

    // Filtro por status
    if (statusFilter !== "all") {
      result = result.filter(
        (content) => content.watch_status === statusFilter,
      );
    }

    // Filtro por ano
    if (yearFilter !== "all") {
      const year = parseInt(yearFilter);
      result = result.filter((content) => content.release_year === year);
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

    setFilteredContents(result);
  }, [contents, searchQuery, statusFilter, yearFilter, sortBy]);

  // Atualizar URL com filtros
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (yearFilter !== "all") params.set("year", yearFilter);

    router.push(`/outros?${params.toString()}`);
  };

  // Verifica se há conteúdos sem ID
  const validContents = contents.filter((content) => content.id);
  if (validContents.length !== contents.length) {
    console.error(
      `Encontrados ${contents.length - validContents.length} conteúdos sem ID`,
    );
  }

  if (validContents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-6 shadow-lg">
          <Monitor className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
          Sua coleção de outros conteúdos está vazia
        </h3>
        <p className="text-muted-foreground mt-2 max-w-md text-lg">
          Comece adicionando seu primeiro conteúdo para criar sua coleção
        </p>
        <Button className="mt-8 gap-2" size="lg" asChild>
          <a href="/outros/new">
            <Plus className="h-5 w-5" />
            Adicionar Primeiro Conteúdo
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
                placeholder="Pesquisar conteúdos..."
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
                    validContents.filter(
                      (m) =>
                        option.value === "all" ||
                        m.watch_status === option.value,
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
            {filteredContents.length}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-foreground">
            {validContents.length}
          </span>{" "}
          conteúdos
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredContents.length > 0 && (
            <span>
              Duração total:{" "}
              <span className="font-semibold text-foreground">
                {Math.round(
                  filteredContents.reduce(
                    (sum, m) => sum + (m.duration || 0),
                    0,
                  ) / 60,
                )}
                h
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Contents Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredContents
            .filter((content) => content.id) // Filtra apenas conteúdos com ID
            .map((content) => (
              <OtherCard
                key={content.id}
                content={content}
                viewMode={viewMode}
                user={user}
              />
            ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContents
            .filter((content) => content.id) // Filtra apenas conteúdos com ID
            .map((content) => (
              <OtherCard
                key={content.id}
                content={content}
                viewMode={viewMode}
                user={user}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {filteredContents.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Nenhum conteúdo encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar seus filtros de busca
          </p>
        </div>
      )}
    </div>
  );
}
