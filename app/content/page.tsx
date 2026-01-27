import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ContentList } from "@/components/content/content-list"
import { ContentFilters } from "@/components/content/content-filters"

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string
    month?: string
    week?: string
    day?: string
    view?: string
    type?: string
    releaseYear?: string
    sort?: string
  }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Build query based on filters
  let query = supabase.from("content").select("*, series(*)").eq("user_id", user.id)

  if (params.releaseYear) {
    const releaseYear = Number.parseInt(params.releaseYear)
    query = query.or(`release_year.eq.${releaseYear},series.release_year.eq.${releaseYear}`)
  } else {
    // Only apply watched date filters if not filtering by release year
    if (params.day) {
      query = query.eq("watched_date", params.day)
    } else if (params.week && params.year) {
      const [year, week] = [Number.parseInt(params.year), Number.parseInt(params.week)]
      const startDate = getDateOfWeek(week, year)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      query = query
        .gte("watched_date", startDate.toISOString().split("T")[0])
        .lte("watched_date", endDate.toISOString().split("T")[0])
    } else if (params.month && params.year) {
      const year = Number.parseInt(params.year)
      const month = Number.parseInt(params.month)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      query = query
        .gte("watched_date", startDate.toISOString().split("T")[0])
        .lte("watched_date", endDate.toISOString().split("T")[0])
    } else if (params.year) {
      const year = Number.parseInt(params.year)
      query = query.gte("watched_date", `${year}-01-01`).lte("watched_date", `${year}-12-31`)
    }
  }

  // Filter by type
  if (params.type && params.type !== "all") {
    query = query.eq("type", params.type)
  }

  const { data: content } = await query.order("watched_date", { ascending: false })

  // Get available years from content
  const { data: allContent } = await supabase.from("content").select("watched_date").eq("user_id", user.id)

  const years = [...new Set(allContent?.map((c) => new Date(c.watched_date).getFullYear()).sort((a, b) => b - a) || [])]

  const { data: allContentWithRelease } = await supabase
    .from("content")
    .select("release_year, series(release_year)")
    .eq("user_id", user.id)

  const releaseYears = [
    ...new Set(
      allContentWithRelease
        ?.map((c) => c.release_year || c.series?.release_year)
        .filter((y): y is number => y !== null && y !== undefined)
        .sort((a, b) => b - a) || [],
    ),
  ]

  let sortedContent = content || []
  const sortType = params.sort || "newest"

  switch (sortType) {
    case "alphabetical-az":
      sortedContent = [...sortedContent].sort((a, b) => {
        const nameA = a.name || a.series?.name || ""
        const nameB = b.name || b.series?.name || ""
        return nameA.localeCompare(nameB)
      })
      break
    case "alphabetical-za":
      sortedContent = [...sortedContent].sort((a, b) => {
        const nameA = a.name || a.series?.name || ""
        const nameB = b.name || b.series?.name || ""
        return nameB.localeCompare(nameA)
      })
      break
    case "oldest":
      sortedContent = [...sortedContent].sort(
        (a, b) => new Date(a.watched_date).getTime() - new Date(b.watched_date).getTime(),
      )
      break
    case "highest-rated":
      sortedContent = [...sortedContent].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    case "lowest-rated":
      sortedContent = [...sortedContent].sort((a, b) => (a.rating || 0) - (b.rating || 0))
      break
    case "newest":
    default:
      sortedContent = [...sortedContent].sort(
        (a, b) => new Date(b.watched_date).getTime() - new Date(a.watched_date).getTime(),
      )
      break
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <ContentFilters
            years={years}
            releaseYears={releaseYears}
            selectedYear={params.year}
            selectedMonth={params.month}
            selectedWeek={params.week}
            selectedDay={params.day}
            selectedView={params.view || "all"}
            selectedType={params.type || "all"}
            selectedReleaseYear={params.releaseYear}
          />
          <ContentList content={sortedContent} view={params.view || "all"} releaseYearView={!!params.releaseYear} />
        </div>
      </main>
    </div>
  )
}

function getDateOfWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dow = simple.getDay()
  const ISOweekStart = simple
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
  return ISOweekStart
}
