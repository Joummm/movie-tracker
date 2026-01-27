"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Film, Star, Clock, Calendar } from "lucide-react"
import type { Content, Series } from "@/lib/types/database"

interface SeriesDetailDialogProps {
  series: Series
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EpisodeBySeason {
  [season: number]: Content[]
}

export function SeriesDetailDialog({ series, open, onOpenChange }: SeriesDetailDialogProps) {
  const [episodes, setEpisodes] = useState<EpisodeBySeason>({})
  const [stats, setStats] = useState({
    totalEpisodes: 0,
    seasons: 0,
    avgRating: 0,
    firstDate: null as string | null,
    lastDate: null as string | null,
  })

  useEffect(() => {
    if (open) {
      loadEpisodes()
    }
  }, [open, series.id])

  const loadEpisodes = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("content")
      .select("*")
      .eq("series_id", series.id)
      .order("season", { ascending: true })
      .order("episode", { ascending: true })

    if (data) {
      const grouped = data.reduce((acc, ep) => {
        const season = ep.season || 0
        if (!acc[season]) {
          acc[season] = []
        }
        acc[season].push(ep)
        return acc
      }, {} as EpisodeBySeason)
      setEpisodes(grouped)

      // Calculate stats
      const sortedDates = data.map((e) => e.watched_date).sort()
      const ratedEpisodes = data.filter((e) => e.rating !== null)
      const avgRating =
        ratedEpisodes.length > 0 ? ratedEpisodes.reduce((acc, e) => acc + (e.rating || 0), 0) / ratedEpisodes.length : 0

      setStats({
        totalEpisodes: data.length,
        seasons: new Set(data.map((e) => e.season)).size,
        avgRating,
        firstDate: sortedDates[0] || null,
        lastDate: sortedDates[sortedDates.length - 1] || null,
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{series.name}</DialogTitle>
              <DialogDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  {stats.totalEpisodes} {stats.totalEpisodes === 1 ? "episódio" : "episódios"}
                  {stats.seasons > 0 && ` em ${stats.seasons} ${stats.seasons === 1 ? "temporada" : "temporadas"}`}
                </div>
                {series.release_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ano de Lançamento: {series.release_year}
                  </div>
                )}
                {stats.avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    Avaliação Média dos Episódios: {stats.avgRating.toFixed(1)}
                  </div>
                )}
              </DialogDescription>
            </div>
            {series.completed && <Badge variant="default">Completa</Badge>}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Primeiro:</span>
              <span className="font-medium">{formatDate(stats.firstDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Último:</span>
              <span className="font-medium">{formatDate(stats.lastDate)}</span>
            </div>
          </div>

          <Separator />

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.keys(episodes).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">A carregar episódios...</p>
              ) : (
                Object.keys(episodes)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((season) => (
                    <div key={season}>
                      <h3 className="font-semibold text-lg mb-3">Temporada {season}</h3>
                      <div className="space-y-2">
                        {episodes[Number(season)].map((episode) => (
                          <Card key={episode.id} className="hover:bg-accent transition-colors">
                            <CardContent className="p-3 sm:p-4">
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <Badge variant="outline" className="w-fit text-xs">
                                    S{episode.season}E{episode.episode}
                                  </Badge>
                                  <span className="font-medium text-sm sm:text-base truncate">
                                    {episode.name || `Episódio ${episode.episode}`}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(episode.watched_date)}
                                  </div>
                                  {episode.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                      {episode.rating.toFixed(1)}
                                    </div>
                                  )}
                                  {episode.duration && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {episode.duration}min
                                    </div>
                                  )}
                                </div>
                                {episode.notes && (
                                  <p className="text-xs sm:text-sm text-muted-foreground italic">{episode.notes}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
