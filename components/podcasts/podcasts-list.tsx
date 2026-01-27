"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { MoreVertical, Edit, Trash2, PlayCircle, Calendar, Mic, Headphones, Plus } from "lucide-react"
import type { Podcast } from "@/lib/types/database"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface PodcastsListProps {
  podcasts: Podcast[]
}

export function PodcastsList({ podcasts }: PodcastsListProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPodcast, setSelectedPodcast] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "A Ouvir"
      case "completed":
        return "Completo"
      case "abandoned":
        return "Abandonado"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-500 hover:bg-blue-600"
      case "completed":
        return "bg-green-500 hover:bg-green-600"
      case "abandoned":
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getDisplayName = (podcast: Podcast) => {
    return podcast.name || "Podcast sem título"
  }

  const getEpisodeCount = (podcast: Podcast) => {
    return podcast.episodes?.length || 0
  }

  const handleDelete = async () => {
    if (!selectedPodcast) return
    
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("podcasts").delete().eq("id", selectedPodcast)

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao apagar podcast",
        variant: "destructive",
      })
      setIsDeleting(false)
    } else {
      toast({
        title: "Sucesso",
        description: "Podcast apagado com sucesso",
      })
      router.refresh()
    }
    
    setShowDeleteDialog(false)
    setSelectedPodcast(null)
  }

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardContent className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (podcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">Nenhum podcast adicionado</p>
        <p className="text-sm text-muted-foreground mt-2">
          Comece adicionando podcasts que você ouve
        </p>
        <Button className="mt-4" asChild>
          <Link href="/podcasts/new">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Podcast
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {podcasts.map((podcast) => (
          <Card key={podcast.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-square bg-muted">
              {podcast.cover_image ? (
                <Image
                  src={podcast.cover_image}
                  alt={getDisplayName(podcast)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Mic className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Menu de ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/podcasts/${podcast.id}`}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/podcasts/edit/${podcast.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedPodcast(podcast.id)
                        setShowDeleteDialog(true)
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Apagar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm line-clamp-2">{getDisplayName(podcast)}</h3>
                <Badge className={`text-xs ${getStatusColor(podcast.status)}`}>
                  {getStatusLabel(podcast.status)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {podcast.host && (
                  <p className="flex items-center gap-1">
                    <span>Host: {podcast.host}</span>
                  </p>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="h-3 w-3" />
                    {getEpisodeCount(podcast)} episódio{getEpisodeCount(podcast) !== 1 ? 's' : ''}
                  </span>
                  
                  {podcast.release_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {podcast.release_year}
                    </span>
                  )}
                </div>

                {podcast.description && (
                  <p className="text-xs line-clamp-2 mt-2">{podcast.description}</p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  asChild
                >
                  <Link href={`/podcasts/${podcast.id}`}>
                    Ver Detalhes
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  asChild
                >
                  <Link href={`/podcasts/${podcast.id}/episodes/add`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Episódio
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Apagar podcast?"
        description="Tem certeza que deseja apagar este podcast? Todos os episódios também serão apagados."
        onConfirm={handleDelete}
        confirmText="Apagar"
        cancelText="Cancelar"
      />
    </>
  )
}