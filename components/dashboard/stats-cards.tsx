import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Tv, Clock, Star, Video } from "lucide-react"

interface StatsCardsProps {
  totalContent: number
  movies: number
  episodes: number
  shorts: number
  other: number
  totalHours: number
  avgRating: number
  seriesCount: number
}

export function StatsCards({
  totalContent,
  movies,
  episodes,
  shorts,
  other,
  totalHours,
  avgRating,
  seriesCount,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total de Conteúdos</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalContent}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {movies} filmes, {episodes} episódios
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Filmes</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{movies}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {shorts} shorts, {other} outros
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Séries</CardTitle>
          <Tv className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{seriesCount}</div>
          <p className="text-xs text-muted-foreground mt-1">{episodes} episódios</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours}h</div>
          <p className="text-xs text-muted-foreground mt-1">De conteúdos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {avgRating > 0 ? "De todos os conteúdos" : "Sem avaliações"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Shorts</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{shorts}</div>
          <p className="text-xs text-muted-foreground mt-1">Conteúdos curtos</p>
        </CardContent>
      </Card>
    </div>
  )
}
