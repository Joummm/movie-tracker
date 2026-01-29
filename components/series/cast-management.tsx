// components/series/cast-management.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  User,
  Users,
  ArrowLeft,
  Award,
  Film
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface CastMember {
  id: string;
  actor_id: string;
  character_name: string;
  is_main_cast: boolean;
  episode_count?: number;
  season_range?: string;
  notes?: string;
  actors: {
    id: string;
    name: string;
    photo_url?: string;
    role: string;
  };
}

interface CastManagementProps {
  seriesId: string;
  seriesName: string;
  cast: CastMember[];
  userId: string;
}

export function CastManagement({ seriesId, seriesName, cast, userId }: CastManagementProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "main" | "guest">("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredCast = cast.filter((member) => {
    // Apply search filter
    const matchesSearch = 
      member.actors.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.character_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply role filter
    const matchesFilter = 
      filter === "all" ||
      (filter === "main" && member.is_main_cast) ||
      (filter === "guest" && !member.is_main_cast);
    
    return matchesSearch && matchesFilter;
  });

  const mainCast = filteredCast.filter(member => member.is_main_cast);
  const guestCast = filteredCast.filter(member => !member.is_main_cast);

  const handleDelete = async (castId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro do elenco?")) {
      return;
    }

    setIsDeleting(castId);

    try {
      const { error } = await supabase
        .from("series_cast")
        .delete()
        .eq("id", castId);

      if (error) throw error;

      alert("Membro removido do elenco com sucesso!");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao remover membro:", error);
      alert(`Erro ao remover membro: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Elenco da Série</h1>
            <p className="text-muted-foreground">
              Gerencie o elenco de "{seriesName}"
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/series/${seriesId}/cast/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou personagem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex rounded-lg border">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="h-9 px-3"
              >
                <Users className="h-4 w-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filter === "main" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("main")}
                className="h-9 px-3"
              >
                <Award className="h-4 w-4 mr-2" />
                Principais
              </Button>
              <Button
                variant={filter === "guest" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("guest")}
                className="h-9 px-3"
              >
                <Film className="h-4 w-4 mr-2" />
                Convidados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredCast.length} de {cast.length} membros
      </div>

      {/* Main Cast */}
      {mainCast.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-semibold">Elenco Principal</h2>
            <Badge variant="secondary">{mainCast.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mainCast.map((member) => (
              <CastCard
                key={member.id}
                member={member}
                onEdit={() => router.push(`/series/${seriesId}/cast/${member.id}/edit`)}
                onDelete={() => handleDelete(member.id)}
                isDeleting={isDeleting === member.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Guest Cast */}
      {guestCast.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Film className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Participações</h2>
            <Badge variant="secondary">{guestCast.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guestCast.map((member) => (
              <CastCard
                key={member.id}
                member={member}
                onEdit={() => router.push(`/series/${seriesId}/cast/${member.id}/edit`)}
                onDelete={() => handleDelete(member.id)}
                isDeleting={isDeleting === member.id}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCast.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum membro do elenco encontrado</p>
          <p className="text-sm mt-2">
            {searchQuery || filter !== "all" 
              ? "Tente ajustar sua busca ou filtro"
              : "Adicione seu primeiro membro ao elenco"
            }
          </p>
          {!searchQuery && filter === "all" && (
            <Button className="mt-4" asChild>
              <Link href={`/series/${seriesId}/cast/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Membro
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface CastCardProps {
  member: CastMember;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  compact?: boolean;
}

function CastCard({ member, onEdit, onDelete, isDeleting, compact = false }: CastCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={member.actors.photo_url} alt={member.actors.name} />
            <AvatarFallback>
              {member.actors.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold truncate">{member.actors.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  como <span className="font-medium">{member.character_name}</span>
                </p>
                {!compact && member.actors.role && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {member.actors.role}
                  </Badge>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={onDelete} 
                    className="text-red-600"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent mr-2" />
                        Removendo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Additional Info */}
            {!compact && (
              <div className="mt-3 space-y-1">
                {(member.episode_count || member.season_range) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {member.episode_count && (
                      <span>{member.episode_count} episódios</span>
                    )}
                    {member.season_range && (
                      <span>Temporadas: {member.season_range}</span>
                    )}
                  </div>
                )}
                {member.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {member.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}