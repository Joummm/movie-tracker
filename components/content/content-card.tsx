"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Film,
  Tv,
  Video,
  MoreHorizontal,
  Star,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Headphones,
} from "lucide-react";
import type { ContentWithSeries } from "@/lib/types/database";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ContentCardProps {
  content: ContentWithSeries;
  isSeriesCard?: boolean;
  isPodcastCard?: boolean;
}

export function ContentCard({
  content,
  isSeriesCard,
  isPodcastCard,
}: ContentCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-4 w-4" />;
      case "episode":
        return <Tv className="h-4 w-4" />;
      case "podcast_episode":
        return <Headphones className="h-4 w-4" />;
      case "short":
        return <Video className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Filme";
      case "episode":
        return "Episódio";
      case "podcast_episode":
        return "Podcast";
      case "short":
        return "Short";
      default:
        return "Outro";
    }
  };

  const getDisplayName = () => {
    if (isSeriesCard && content.series) {
      return content.series.name;
    }
    if (isPodcastCard && content.podcast) {
      return content.podcast.name;
    }
    if (content.name) {
      return content.name;
    }
    // Fallback for episodes without a name
    if (content.type === "episode" && content.series) {
      return `${content.series.name} - S${content.season}E${content.episode}`;
    }
    if (content.type === "podcast_episode" && content.podcast) {
      return `${content.podcast.name} - Ep ${content.episode}`;
    }
    return "Sem título";
  };

  const getReleaseYear = () => {
    return (
      content.release_year ||
      content.series?.release_year ||
      content.podcast?.release_year
    );
  };

  const getSecondaryInfo = () => {
    if (isPodcastCard && content.podcast) {
      return content.podcast.host ? `Host: ${content.podcast.host}` : "";
    }
    return null;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();

    // Verificar o tipo de conteúdo para deletar da tabela correta
    let table = "content";
    let id = content.id;

    if (content.type === "podcast_episode") {
      table = "podcast_episodes";
    }

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao apagar conteúdo",
        variant: "destructive",
      });
      setIsDeleting(false);
    } else {
      toast({
        title: "Sucesso",
        description: "Conteúdo apagado com sucesso",
      });
      router.refresh();
    }
  };

  const handleCardClick = () => {
    if (isSeriesCard || isPodcastCard) {
      return; // Não redireciona para séries/podcasts agrupados
    }

    // Redireciona para a página de detalhes do conteúdo
    if (content.type === "podcast_episode") {
      router.push(`/content/podcast/${content.id}`);
    } else {
      router.push(`/content/${content.id}`);
    }
  };

  // Safe date parsing
  const formatWatchedDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Card
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative aspect-2/3 bg-muted">
          {content.cover_image ||
          content.series?.cover_image ||
          content.podcast?.cover_image ? (
            <Image
              src={
                content.cover_image ||
                content.series?.cover_image ||
                content.podcast?.cover_image ||
                ""
              }
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              alt={""}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              {getIcon(content.type)}
            </div>
          )}
          {!isSeriesCard && !isPodcastCard && (
            <div
              className="absolute top-2 right-2"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu de ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      if (content.type === "podcast_episode") {
                        router.push(`/content/podcast/${content.id}/edit`);
                      } else {
                        router.push(`/content/edit/${content.id}`);
                      }
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Apagar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-2">
              {getDisplayName()}
            </h3>
            {content.rating && !isSeriesCard && !isPodcastCard && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-medium">
                  {content.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {isSeriesCard
                ? "Série"
                : isPodcastCard
                  ? "Podcast"
                  : getTypeLabel(content.type)}
            </Badge>
            {content.duration && !isSeriesCard && !isPodcastCard && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {content.duration}min
              </Badge>
            )}
            {getReleaseYear() && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {getReleaseYear()}
              </Badge>
            )}
          </div>

          {getSecondaryInfo() && (
            <p className="text-xs text-muted-foreground mb-2">
              {getSecondaryInfo()}
            </p>
          )}

          {!isSeriesCard &&
            !isPodcastCard &&
            content.series &&
            content.name &&
            content.type === "episode" && (
              <p className="text-xs text-muted-foreground mb-2">
                {content.series.name} - S{content.season}E{content.episode}
              </p>
            )}

          {!isSeriesCard &&
            !isPodcastCard &&
            content.podcast &&
            content.type === "podcast_episode" && (
              <p className="text-xs text-muted-foreground mb-2">
                {content.podcast.name} - Ep {content.episode}
              </p>
            )}

          {!isSeriesCard && !isPodcastCard && content.watched_date && (
            <p className="text-xs text-muted-foreground">
              {formatWatchedDate(content.watched_date)}
            </p>
          )}

          {isSeriesCard && (
            <p className="text-xs text-muted-foreground">
              Clique para ver todos os episódios
            </p>
          )}
          {isPodcastCard && (
            <p className="text-xs text-muted-foreground">
              Clique para ver todos os episódios
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Apagar conteúdo?"
        description="Tem certeza que deseja apagar este conteúdo? Esta ação não pode ser desfeita."
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
