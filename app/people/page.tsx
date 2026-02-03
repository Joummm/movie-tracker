// app/people/page.tsx - ATUALIZADO COM HEADER
"use client";

import { useState, useEffect } from "react";
import { PeopleGrid } from "@/components/people/PeopleGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Person } from "@/lib/types/person";

interface PersonFilters {
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PersonFilters>({
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  });
  const [activeTab, setActiveTab] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    loadPeople();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [people, filters, activeTab]);

  const loadPeople = async () => {
    try {
      setLoading(true);

      // Buscar pessoas
      const { data: peopleData, error } = await supabase
        .from("actors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setPeople(peopleData || []);
    } catch (error) {
      console.error("Error loading people:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...people];

    // Aplicar filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (person) =>
          person.name.toLowerCase().includes(searchLower) ||
          (person.biography &&
            person.biography.toLowerCase().includes(searchLower)) ||
          (person.nationality &&
            person.nationality.toLowerCase().includes(searchLower)),
      );
    }

    // Aplicar filtro de tab
    if (activeTab !== "all") {
      filtered = filtered.filter((person) => person.role === activeTab);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (filters.sortBy) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "popularity":
          valueA = a.popularity || 0;
          valueB = b.popularity || 0;
          break;
        case "created_at":
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        case "updated_at":
          valueA = new Date(a.updated_at).getTime();
          valueB = new Date(b.updated_at).getTime();
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (filters.sortOrder === "desc") {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    });

    setFilteredPeople(filtered);
  };

  // ATUALIZAR A FUNÇÃO getStats:
  const getStats = () => {
    const total = people.length;
    const actors = people.filter((p) => p.role === "actor").length;
    const directors = people.filter((p) => p.role === "director").length;
    const writers = people.filter((p) => p.role === "writer").length;
    const producers = people.filter((p) => p.role === "producer").length;
    const hosts = people.filter((p) => p.role === "host").length;
    const others = people.filter((p) => p.role === "other").length;

    return {
      total,
      actors,
      directors,
      writers,
      producers,
      hosts,
      others,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/80">
      <DashboardHeader userName="Utilizador" />

      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Pessoas
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie atores, diretores, produtores e outras pessoas
                envolvidas nas suas produções
              </p>
            </div>

            <Button
              asChild
              className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              <Link href="/people/new">
                <UserPlus className="h-4 w-4" />
                Adicionar Pessoa
              </Link>
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 mb-6">
            <Card className="bg-linear-to-br from-background to-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {stats.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-500">
                    {stats.actors}
                  </div>
                  <div className="text-xs text-muted-foreground">Atores</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-500">
                    {stats.directors}
                  </div>
                  <div className="text-xs text-muted-foreground">Diretores</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-500">
                    {stats.writers}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Escritores
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-500">
                    {stats.producers}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Produtores
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-pink-500">
                    {stats.hosts}
                  </div>
                  <div className="text-xs text-muted-foreground">Hosts</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-500">
                    {stats.others}
                  </div>
                  <div className="text-xs text-muted-foreground">Outros</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros e Tabs */}
        <Card className="mb-6 border-border/50 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barra de pesquisa */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pessoas..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) =>
                    setFilters({ ...filters, sortBy: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="popularity">Popularidade</SelectItem>
                    <SelectItem value="created_at">Data de Criação</SelectItem>
                    <SelectItem value="updated_at">
                      Última Atualização
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: any) =>
                    setFilters({ ...filters, sortOrder: value })
                  }
                >
                  <SelectTrigger className="w-30">
                    <SelectValue placeholder="Ordem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      search: "",
                      sortBy: "name",
                      sortOrder: "asc",
                    })
                  }
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-4"
            >
              <TabsList className="flex flex-wrap h-auto gap-2">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Todos
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="actor" className="flex items-center gap-2">
                  <span className="text-blue-500">👤</span>
                  Atores
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.actors}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="director"
                  className="flex items-center gap-2"
                >
                  <span className="text-purple-500">🎬</span>
                  Diretores
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.directors}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="writer" className="flex items-center gap-2">
                  <span className="text-emerald-500">✍️</span>
                  Escritores
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.writers}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="producer"
                  className="flex items-center gap-2"
                >
                  <span className="text-amber-500">💰</span>
                  Produtores
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.producers}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="host" className="flex items-center gap-2">
                  <span className="text-pink-500">🎙️</span>
                  Hosts
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.hosts}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="other" className="flex items-center gap-2">
                  <span className="text-gray-500">🌟</span>
                  Outros
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.others}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredPeople.length} de {people.length} pessoas
            </div>

            {filters.search && (
              <div className="text-sm">
                Resultados para:{" "}
                <span className="font-semibold">{filters.search}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="animate-pulse border-border/50">
                  <CardContent className="p-0">
                    <div className="h-48 bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPeople.length === 0 ? (
            <Card className="text-center py-12 border-border/50">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma pessoa encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filters.search
                    ? "Tente ajustar os seus critérios de pesquisa."
                    : "Comece por adicionar a primeira pessoa à sua coleção."}
                </p>
                <Button asChild>
                  <Link href="/people/new">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Pessoa
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PeopleGrid people={filteredPeople} />
          )}
        </div>
      </div>
    </div>
  );
}
