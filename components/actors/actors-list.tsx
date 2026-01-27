import { ActorCard } from "./actor-card"
import type { Actor } from "@/lib/types/database"

interface ActorsListProps {
  actors: Actor[]
}

export function ActorsList({ actors }: ActorsListProps) {
  if (actors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">Nenhum ator adicionado</p>
        <p className="text-sm text-muted-foreground mt-2">
          Adicione atores para associar aos seus conteúdos
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {actors.map((actor) => (
        <ActorCard key={actor.id} actor={actor} />
      ))}
    </div>
  )
}