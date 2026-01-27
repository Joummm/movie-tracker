"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { User, MoreVertical, Edit, Trash2, Film, Tv, Video } from "lucide-react"
import type { Actor } from "@/lib/types/database"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ActorCardProps {
  actor: Actor
}

export function ActorCard({ actor }: ActorCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("actors").delete().eq("id", actor.id)

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao apagar ator",
        variant: "destructive",
      })
      setIsDeleting(false)
    } else {
      toast({
        title: "Sucesso",
        description: "Ator apagado com sucesso",
      })
      router.refresh()
    }
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/actors/${actor.id}`)}>
        <div className="relative aspect-square bg-muted">
          {actor.photo_url ? (
            <Image
              src={actor.photo_url}
              alt={actor.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu de ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/actors/edit/${actor.id}`)}>
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
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1">{actor.name}</h3>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            {actor.nationality && (
              <p>{actor.nationality}</p>
            )}
            {actor.birth_date && (
              <p>
                Nascimento: {new Date(actor.birth_date).toLocaleDateString("pt-PT")}
                {actor.death_date && ` - Morte: ${new Date(actor.death_date).toLocaleDateString("pt-PT")}`}
              </p>
            )}
            {actor.gender && (
              <p className="capitalize">{actor.gender.replace('_', ' ')}</p>
            )}
          </div>

          {actor.biography && (
            <p className="text-sm mt-2 line-clamp-2">{actor.biography}</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Apagar ator?"
        description="Tem certeza que deseja apagar este ator? Esta ação não pode ser desfeita."
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