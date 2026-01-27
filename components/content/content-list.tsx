import { ContentCard } from "./content-card"
import type { ContentWithSeries } from "@/lib/types/database"
import { SeriesDetailDialog } from "../series/series-detail-dialog"

interface ContentListProps {
  content: ContentWithSeries[]
  view: string
  releaseYearView?: boolean
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function ContentList({ content, view, releaseYearView }: ContentListProps) {
  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">Nenhum conteúdo encontrado</p>
        <p className="text-sm text-muted-foreground mt-2">Comece adicionando filmes ou séries que você assistiu</p>
      </div>
    )
  }

  if (releaseYearView) {
    // Group episodes by series, keep other content as is
    const groupedContent: { [key: string]: ContentWithSeries[] } = {}
    const standaloneContent: ContentWithSeries[] = []

    content.forEach((item) => {
      if (item.type === "episode" && item.series_id) {
        if (!groupedContent[item.series_id]) {
          groupedContent[item.series_id] = []
        }
        groupedContent[item.series_id].push(item)
      } else {
        standaloneContent.push(item)
      }
    })

    return (
      <div className="space-y-8">
        {/* Render standalone content */}
        {standaloneContent.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Filmes e Outros</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {standaloneContent.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          </div>
        )}

        {/* Render series grouped */}
        {Object.keys(groupedContent).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Séries</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(groupedContent).map(([seriesId, episodes]) => {
                const series = episodes[0].series
                if (!series) return null

                return (
                  <SeriesDetailDialog
                    key={seriesId}
                    series={series}
                    episodes={episodes}
                    trigger={
                      <div className="cursor-pointer group">
                        <ContentCard content={episodes[0]} isSeriesCard />
                      </div>
                    }
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Group by date for different views
  if (view === "weeks") {
    const groupedByWeek = content.reduce(
      (acc, item) => {
        const date = new Date(item.watched_date)
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

    return (
      <div className="space-y-8">
        {Object.entries(groupedByWeek)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([weekKey, { weekStart, items }]) => {
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
      </div>
    )
  }

  if (view === "months") {
    const groupedByMonth = content.reduce(
      (acc, item) => {
        const date = new Date(item.watched_date)
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

    return (
      <div className="space-y-8">
        {Object.entries(groupedByMonth)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([monthKey, { month, items }]) => {
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
      </div>
    )
  }

  if (view === "days") {
    const groupedByDay = content.reduce(
      (acc, item) => {
        const dateKey = item.watched_date
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: new Date(dateKey),
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

    return (
      <div className="space-y-8">
        {Object.entries(groupedByDay)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([dateKey, { date, items }]) => {
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
      </div>
    )
  }

  // Default grid view
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {content.map((item) => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  )
}
