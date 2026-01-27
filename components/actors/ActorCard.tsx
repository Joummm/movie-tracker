"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  MoreVertical,
  Edit,
  Trash2,
  Film,
  Tv,
  Calendar,
  MapPin,
  Award,
  Star,
  ExternalLink,
} from "lucide-react";
import type { Actor } from "@/lib/types/database";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ActorCardProps {
  actor: Actor;
}

export function ActorCard({ actor }: ActorCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [moviesCount, setMoviesCount] = useState<number | null>(null);
  const [seriesCount, setSeriesCount] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { toast } = useToast();

  // Calcular idade se tiver data de nascimento
  const calculateAge = () => {
    if (!actor.birth_date) return null;

    const birthDate = new Date(actor.birth_date);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const age = calculateAge();

  // Buscar estatísticas do ator
  useEffect(() => {
    const fetchActorStats = async () => {
      setIsLoadingStats(true);
      const supabase = createClient();

      try {
        // Contar filmes (content do tipo movie)
        const { count: movies } = await supabase
          .from("content_actors")
          .select("*", { count: "exact", head: true })
          .eq("actor_id", actor.id)
          .not("content_id", "is", null);

        // Contar séries
        const { count: series } = await supabase
          .from("content_actors")
          .select("*", { count: "exact", head: true })
          .eq("actor_id", actor.id)
          .not("series_id", "is", null);

        setMoviesCount(movies || 0);
        setSeriesCount(series || 0);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchActorStats();
  }, [actor.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("actors").delete().eq("id", actor.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao apagar ator",
        variant: "destructive",
      });
      setIsDeleting(false);
    } else {
      toast({
        title: "Sucesso",
        description: "Ator apagado com sucesso",
      });
      router.refresh();
    }
  };

  return (
    <>
      <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-linear-to-br from-background to-muted/30 hover:from-muted/20 hover:to-background">
        {/* Fundo decorativo */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div
          className="relative aspect-3/4 bg-linear-to-br from-muted/50 to-muted/30 overflow-hidden"
          onClick={() => router.push(`/actors/${actor.id}`)}
        >
          {actor.photo_url ? (
            <Image
              src={actor.photo_url}
              alt={actor.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10">
              <User className="h-24 w-24 text-muted-foreground/50" />
            </div>
          )}

          {/* Overlay gradiente na imagem */}
          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Botão de ações */}
          <div
            className="absolute top-3 right-3"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-md cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu de ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => router.push(`/actors/edit/${actor.id}`)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/actors/${actor.id}`)}
                  className="cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Apagar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badge de gênero no canto superior esquerdo */}
          {actor.gender && (
            <div className="absolute top-3 left-3">
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm capitalize px-3 py-1 font-medium"
              >
                {actor.gender.replace("_", " ")}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Nome e nacionalidade */}
          <div>
            <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors line-clamp-1">
              {actor.name}
            </h3>
            {actor.nationality && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="line-clamp-1">{actor.nationality}</span>
              </div>
            )}
          </div>

          {/* Informações de data */}
          {actor.birth_date && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  <span>
                    {new Date(actor.birth_date).toLocaleDateString("pt-PT")}
                  </span>
                </div>
                {age !== null && !actor.death_date && (
                  <Badge variant="outline" className="text-xs">
                    {age} anos
                  </Badge>
                )}
              </div>

              {actor.death_date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  <span>
                    Morte:{" "}
                    {new Date(actor.death_date).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
              <Film className="h-5 w-5 mb-1 text-primary" />
              {isLoadingStats ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                <span className="font-bold text-lg">{moviesCount || 0}</span>
              )}
              <span className="text-xs text-muted-foreground">Filmes</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
              <Tv className="h-5 w-5 mb-1 text-secondary" />
              {isLoadingStats ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                <span className="font-bold text-lg">{seriesCount || 0}</span>
              )}
              <span className="text-xs text-muted-foreground">Séries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Apagar ator?"
        description="Tem certeza que deseja apagar este ator? Esta ação não pode ser desfeita."
        onConfirm={() => {
          setShowDeleteDialog(false);
          handleDelete();
        }}
        confirmText="Apagar"
        cancelText="Cancelar"
      />
    </>
  );
}
