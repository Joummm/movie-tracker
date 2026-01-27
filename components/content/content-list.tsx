"use client"

import { ContentCard } from "./content-card"
import type { ContentWithSeries } from "@/lib/types/database"
import { SeriesDetailDialog } from "../series/series-detail-dialog"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface ContentListProps {
  content: ContentWithSeries[]
  view: string
  releaseYearView?: boolean
}

interface SeriesDetailDialogProps {
  series: any;
  episodes: ContentWithSeries[];
  trigger: React.ReactNode;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Safe date utility functions
function safeGetDate(dateString?: string): Date | null {
  if (!dateString) return null
  try {
    return new Date(dateString)
  } catch {
    return null
  }
}

// Componente de fallback para podcasts
function PodcastGroupCard({ podcast, episodes }: { podcast: any; episodes: ContentWithSeries[] }) {
  const router = useRouter()
  
  const handleClick = () => {
    // Redireciona para a página do podcast
    if (podcast?.id) {
      router.push(`/podcasts/${podcast.id}`)
    }
  }
  
  return (
    <div 
      className="cursor-pointer group"
      onClick={handleClick}
    >
      <ContentCard content={episodes[0]} isPodcastCard />
    </div>
  )
}

export function ContentList({ content, view, releaseYearView }: ContentListProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">Nenhum conteúdo encontrado</p>
        <p className="text-sm text-muted-foreground mt-2">Comece adicionando filmes, séries ou podcasts que você consumiu</p>
      </div>
    )
  }

  // Calculate pagination
  const totalPages = Math.ceil(content.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = content.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  if (releaseYearView) {
    // Group episodes by series, podcast episodes by podcast, keep other content as is
    const groupedSeriesContent: { [key: string]: ContentWithSeries[] } = {}
    const groupedPodcastContent: { [key: string]: ContentWithSeries[] } = {}
    const standaloneContent: ContentWithSeries[] = []

    content.forEach((item) => {
      if (item.type === "episode" && item.series_id) {
        if (!groupedSeriesContent[item.series_id]) {
          groupedSeriesContent[item.series_id] = []
        }
        groupedSeriesContent[item.series_id].push(item)
      } else if (item.type === "podcast_episode" && item.podcast_id) {
        if (!groupedPodcastContent[item.podcast_id]) {
          groupedPodcastContent[item.podcast_id] = []
        }
        groupedPodcastContent[item.podcast_id].push(item)
      } else {
        standaloneContent.push(item)
      }
    })

    const renderContentGrid = (items: ContentWithSeries[]) => (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>
    )

    return (
      <div className="space-y-8">
        {/* Render standalone content */}
        {standaloneContent.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Filmes e Outros</h3>
            {renderContentGrid(standaloneContent)}
          </div>
        )}

        {/* Render series grouped */}
        {Object.keys(groupedSeriesContent).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Séries</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(groupedSeriesContent).map(([seriesId, episodes]) => {
                const series = episodes[0]?.series
                if (!series) return null

                return (
                  <div key={seriesId} className="cursor-pointer group">
                    <ContentCard content={episodes[0]} isSeriesCard />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Render podcasts grouped */}
        {Object.keys(groupedPodcastContent).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Podcasts</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(groupedPodcastContent).map(([podcastId, episodes]) => {
                const podcast = episodes[0]?.podcast
                if (!podcast) return null

                return (
                  <PodcastGroupCard
                    key={podcastId}
                    podcast={podcast}
                    episodes={episodes}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Group by date for different views
  if (view === "weeks") {
    const groupedByWeek = content.reduce(
      (acc, item) => {
        const date = safeGetDate(item.watched_date)
        if (!date) return acc
        
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`
        if (!acc[weekKey]) {
          acc[weekKey] = {
            weekStart: new Date(weekStart),
            items: [],
          }
        }
        acc[weekKey].items.push(item)
        return acc
      },
      {} as Record<
        string,
        {
          weekStart: Date
          items: ContentWithSeries[]
        }
      >,
    )

    const weekEntries = Object.entries(groupedByWeek)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(startIndex, endIndex)

    return (
      <div className="space-y-8">
        {weekEntries.map(([weekKey, { weekStart, items }]) => {
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          return (
            <div key={weekKey}>
              <div className="mb-4 flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  {weekStart.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} -{" "}
                  {weekEnd.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (view === "months") {
    const groupedByMonth = content.reduce(
      (acc, item) => {
        const date = safeGetDate(item.watched_date)
        if (!date) return acc
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: date,
            items: [],
          }
        }
        acc[monthKey].items.push(item)
        return acc
      },
      {} as Record<
        string,
        {
          month: Date
          items: ContentWithSeries[]
        }
      >,
    )

    const monthEntries = Object.entries(groupedByMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(startIndex, endIndex)

    return (
      <div className="space-y-8">
        {monthEntries.map(([monthKey, { month, items }]) => {
          return (
            <div key={monthKey}>
              <div className="mb-4 flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  {month.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (view === "days") {
    const groupedByDay = content.reduce(
      (acc, item) => {
        const dateKey = item.watched_date
        if (!dateKey) return acc
        
        const date = safeGetDate(dateKey)
        if (!date) return acc
        
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: date,
            items: [],
          }
        }
        acc[dateKey].items.push(item)
        return acc
      },
      {} as Record<
        string,
        {
          date: Date
          items: ContentWithSeries[]
        }
      >,
    )

    const dayEntries = Object.entries(groupedByDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(startIndex, endIndex)

    return (
      <div className="space-y-8">
        {dayEntries.map(([dateKey, { date, items }]) => {
          return (
            <div key={dateKey}>
              <div className="mb-4 flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  {date.toLocaleDateString("pt-PT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Default grid view
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentItems.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}