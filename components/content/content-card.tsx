"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { Film, Tv, Video, MoreHorizontal, Star, Clock, Edit, Trash2, MoreVertical, Calendar } from "lucide-react"
import type { ContentWithSeries } from "@/lib/types/database"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ContentCardProps {
  content: ContentWithSeries
  isSeriesCard?: boolean
}

export function ContentCard({ content, isSeriesCard }: ContentCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const getIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-4 w-4" />
      case "episode":
        return <Tv className="h-4 w-4" />
      case "short":
        return <Video className="h-4 w-4" />
      default:
        return <MoreHorizontal className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Filme"
      case "episode":
        return "Episódio"
      case "short":
        return "Short"
      default:
        return "Outro"
    }
  }

  const getDisplayName = () => {
    if (isSeriesCard && content.series) {
      return content.series.name
    }
    if (content.name) {
      return content.name
    }
    // Fallback for episodes without a name
    if (content.type === "episode" && content.series) {
      return `${content.series.name} - S${content.season}E${content.episode}`
    }
    return "Sem título"
  }

  const getReleaseYear = () => {
    return content.release_year || content.series?.release_year
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("content").delete().eq("id", content.id)

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao apagar conteúdo",
        variant: "destructive",
      })
      setIsDeleting(false)
    } else {
      toast({
        title: "Sucesso",
        description: "Conteúdo apagado com sucesso",
      })
      router.refresh()
    }
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-[2/3] bg-muted">
          {content.cover_image || content.series?.cover_image ? (
            <Image
              src={content.cover_image || content.series?.cover_image || ""}
              alt={getDisplayName()}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">{getIcon(content.type)}</div>
          )}
          {!isSeriesCard && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu de ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/content/edit/${content.id}`)}>
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
            <h3 className="font-semibold text-sm line-clamp-2">{getDisplayName()}</h3>
            {content.rating && !isSeriesCard && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-medium">{content.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {isSeriesCard ? "Série" : getTypeLabel(content.type)}
            </Badge>
            {content.duration && !isSeriesCard && (
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

          {!isSeriesCard && content.series && content.name && (
            <p className="text-xs text-muted-foreground mb-2">
              {content.series.name} - S{content.season}E{content.episode}
            </p>
          )}

          {!isSeriesCard && (
            <p className="text-xs text-muted-foreground">
              {new Date(content.watched_date).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {isSeriesCard && <p className="text-xs text-muted-foreground">Clique para ver todos os episódios</p>}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Apagar conteúdo?"
        description="Tem certeza que deseja apagar este conteúdo? Esta ação não pode ser desfeita."
        onConfirm={() => {
          setShowDeleteDialog(false)
          handleDelete()
        }}
        confirmText="Apagar"
        cancelText="Cancelar"
      />
    </>
  )
}
