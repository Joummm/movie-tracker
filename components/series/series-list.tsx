"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SeriesDetailDialog } from "./series-detail-dialog"
import { Tv, Calendar, CalendarCheck, Film, Edit, Star, Play, CheckCircle, Ban, ListTree } from "lucide-react"
import type { Series, SeriesStatus } from "@/lib/types/database"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface SeriesWithStats extends Series {
  firstEpisodeDate: string | null
  lastEpisodeDate: string | null
  totalEpisodes: number
  seasons: number
  avgRating: number
}

interface SeriesListProps {
  series: SeriesWithStats[]
}

export function SeriesList({ series: initialSeries }: SeriesListProps) {
  const [selectedSeries, setSelectedSeries] = useState<SeriesWithStats | null>(null)
  const [series, setSeries] = useState(initialSeries)
  const [statusFilter, setStatusFilter] = useState<SeriesStatus | "all">("all")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const filteredSeries = statusFilter === "all" ? series : series.filter((s) => s.status === statusFilter)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const updateSeriesStatus = async (seriesId: string, newStatus: SeriesStatus) => {
    try {
      const { error } = await supabase.from("series").update({ status: newStatus }).eq("id", seriesId)

      if (error) throw error

      // Update local state
      setSeries(series.map((s) => (s.id === seriesId ? { ...s, status: newStatus } : s)))

      toast({
        title: "Status atualizado",
        description: `Série marcada como ${
          newStatus === "completed" ? "completa" : newStatus === "abandoned" ? "abandonada" : "a ver"
        }`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da série",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status?: SeriesStatus) => {
    switch (status) {
      case "completed":
        return { variant: "default" as const, label: "Completa", icon: CheckCircle }
      case "abandoned":
        return { variant: "destructive" as const, label: "Abandonada", icon: Ban }
      case "in_progress":
      default:
        return { variant: "secondary" as const, label: "A Ver", icon: Play }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Minhas Séries</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter">Filtrar por:</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SeriesStatus | "all")}>
              <SelectTrigger id="status-filter" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="in_progress">A Ver</SelectItem>
                <SelectItem value="completed">Completas</SelectItem>
                <SelectItem value="abandoned">Abandonadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filteredSeries.length} {filteredSeries.length === 1 ? "Série" : "Séries"}
          </Badge>
        </div>
      </div>

      {filteredSeries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tv className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Nenhuma série encontrada</p>
            <p className="text-sm text-muted-foreground mt-2">
              {statusFilter === "all"
                ? "Adicione episódios para ver suas séries aqui"
                : `Nenhuma série ${
                    statusFilter === "completed"
                      ? "completa"
                      : statusFilter === "abandoned"
                        ? "abandonada"
                        : "a ver"
                  } encontrada`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSeries.map((s) => {
            const statusBadge = getStatusBadge(s.status)
            const StatusIcon = statusBadge.icon

            return (
              <Card key={s.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {s.cover_image && (
                  <div className="relative aspect-video bg-muted cursor-pointer" onClick={() => setSelectedSeries(s)}>
                    <Image src={s.cover_image || "/placeholder.svg"} alt={s.name} fill className="object-cover" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedSeries(s)}>
                      <CardTitle className="text-xl mb-2">{s.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        {s.totalEpisodes} {s.totalEpisodes === 1 ? "episódio" : "episódios"}
                        {s.seasons > 0 && ` • ${s.seasons} ${s.seasons === 1 ? "temporada" : "temporadas"}`}
                      </CardDescription>
                    </div>
                    <Badge variant={statusBadge.variant} className="ml-2 flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Início: {formatDate(s.firstEpisodeDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarCheck className="h-4 w-4" />
                    <span>Último: {formatDate(s.lastEpisodeDate)}</span>
                  </div>
                  {s.avgRating > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>Média: {s.avgRating.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 pt-2">
                    <Button
                      variant={s.status === "in_progress" ? "default" : "outline"}
                      size="sm"
                      className={s.status === "in_progress" ? "" : "bg-transparent"}
                      onClick={() => updateSeriesStatus(s.id, "in_progress")}
                      title="Marcar como a ver"
                    >
                      <Play className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">A Ver</span>
                    </Button>
                    <Button
                      variant={s.status === "completed" ? "default" : "outline"}
                      size="sm"
                      className={s.status === "completed" ? "" : "bg-transparent"}
                      onClick={() => updateSeriesStatus(s.id, "completed")}
                      title="Marcar como completa"
                    >
                      <CheckCircle className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Completa</span>
                    </Button>
                    <Button
                      variant={s.status === "abandoned" ? "destructive" : "outline"}
                      size="sm"
                      className={s.status === "abandoned" ? "" : "bg-transparent"}
                      onClick={() => updateSeriesStatus(s.id, "abandoned")}
                      title="Marcar como abandonada"
                    >
                      <Ban className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Abandonada</span>
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setSelectedSeries(s)}>
                      Ver Detalhes
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => router.push(`/series/${s.id}/structure`)}
                      title="Estrutura de Episódios"
                    >
                      <ListTree className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/series/edit/${s.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedSeries && (
        <SeriesDetailDialog
          series={selectedSeries}
          open={!!selectedSeries}
          onOpenChange={(open) => !open && setSelectedSeries(null)}
        />
      )}
    </div>
  )
}
