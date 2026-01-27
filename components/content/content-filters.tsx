"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { Label } from "@/components/ui/label"

interface ContentFiltersProps {
  years: number[]
  releaseYears: number[]
  selectedYear?: string
  selectedMonth?: string
  selectedWeek?: string
  selectedDay?: string
  selectedView: string
  selectedType: string
  selectedReleaseYear?: string
}

export function ContentFilters({
  years,
  releaseYears,
  selectedYear,
  selectedMonth,
  selectedWeek,
  selectedDay,
  selectedView,
  selectedType,
  selectedReleaseYear,
}: ContentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset month/week/day when changing year or view
    if (key === "year" || key === "view") {
      params.delete("month")
      params.delete("week")
      params.delete("day")
    }
    if (key === "month") {
      params.delete("day")
      params.delete("week")
    }
    if (key === "releaseYear") {
      params.delete("year")
      params.delete("month")
      params.delete("week")
      params.delete("day")
      params.delete("view")
    }
    if (key === "year") {
      params.delete("releaseYear")
    }
    router.push(`/content?${params.toString()}`)
  }

  const navigateDay = (direction: "prev" | "next") => {
    if (!selectedDay) return
    const currentDate = new Date(selectedDay)
    currentDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
    const newDay = currentDate.toISOString().split("T")[0]
    updateFilter("day", newDay)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    if (!selectedWeek || !selectedYear) return
    const week = Number.parseInt(selectedWeek)
    const year = Number.parseInt(selectedYear)
    let newWeek = direction === "next" ? week + 1 : week - 1
    let newYear = year

    if (newWeek > 52) {
      newWeek = 1
      newYear += 1
    } else if (newWeek < 1) {
      newWeek = 52
      newYear -= 1
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("week", newWeek.toString())
    params.set("year", newYear.toString())
    router.push(`/content?${params.toString()}`)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (!selectedMonth || !selectedYear) return
    const month = Number.parseInt(selectedMonth)
    const year = Number.parseInt(selectedYear)
    let newMonth = direction === "next" ? month + 1 : month - 1
    let newYear = year

    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    } else if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("month", newMonth.toString())
    params.set("year", newYear.toString())
    router.push(`/content?${params.toString()}`)
  }

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ]

  const selectedSort = searchParams.get("sort") || "newest"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Meus Conteúdos</h1>
        <div className="flex gap-2 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sort-select" className="text-xs text-muted-foreground">
              Ordenar por
            </Label>
            <Select value={selectedSort} onValueChange={(value) => updateFilter("sort", value)}>
              <SelectTrigger id="sort-select" className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical-az">A-Z</SelectItem>
                <SelectItem value="alphabetical-za">Z-A</SelectItem>
                <SelectItem value="newest">Mais Recente</SelectItem>
                <SelectItem value="oldest">Mais Antigo</SelectItem>
                <SelectItem value="highest-rated">Melhor Avaliado</SelectItem>
                <SelectItem value="lowest-rated">Pior Avaliado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type-select" className="text-xs text-muted-foreground">
              Tipo de conteúdo
            </Label>
            <Select value={selectedType} onValueChange={(value) => updateFilter("type", value)}>
              <SelectTrigger id="type-select" className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="movie">Filmes</SelectItem>
                <SelectItem value="episode">Episódios</SelectItem>
                <SelectItem value="short">Shorts</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {releaseYears.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="release-year-select" className="text-xs text-muted-foreground">
                Ano de lançamento
              </Label>
              <Select
                value={selectedReleaseYear || "all"}
                onValueChange={(value) => updateFilter("releaseYear", value)}
              >
                <SelectTrigger id="release-year-select" className="w-[180px]">
                  <SelectValue placeholder="Ano Lançamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {releaseYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="year-select" className="text-xs text-muted-foreground">
              Ano assistido
            </Label>
            <Select value={selectedYear || "all"} onValueChange={(value) => updateFilter("year", value)}>
              <SelectTrigger id="year-select" className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedYear && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Visualização:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedView === "all" ? "default" : "outline"}
              onClick={() => updateFilter("view", "all")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Todos
            </Button>
            <Button
              variant={selectedView === "days" ? "default" : "outline"}
              onClick={() => updateFilter("view", "days")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Por Dia
            </Button>
            <Button
              variant={selectedView === "weeks" ? "default" : "outline"}
              onClick={() => updateFilter("view", "weeks")}
              className="gap-2"
            >
              <CalendarRange className="h-4 w-4" />
              Por Semana
            </Button>
            <Button
              variant={selectedView === "months" ? "default" : "outline"}
              onClick={() => updateFilter("view", "months")}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Por Mês
            </Button>
          </div>
        </div>
      )}

      {selectedYear && selectedView === "days" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Selecione um dia:</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDay("prev")} disabled={!selectedDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="date"
              value={selectedDay || ""}
              onChange={(e) => updateFilter("day", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button variant="outline" size="icon" onClick={() => navigateDay("next")} disabled={!selectedDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedYear && selectedView === "weeks" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Selecione uma semana:</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")} disabled={!selectedWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select
              value={selectedWeek || ""}
              onValueChange={(value) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("week", value)
                params.set("view", "weeks")
                router.push(`/content?${params.toString()}`)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma semana" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Semana {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => navigateWeek("next")} disabled={!selectedWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedYear && selectedView === "months" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Selecione um mês:</span>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")} disabled={!selectedMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center font-medium">
              {selectedMonth
                ? months.find((m) => m.value === selectedMonth)?.label + " " + selectedYear
                : "Escolha um mês"}
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")} disabled={!selectedMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {months.map((month) => (
              <Button
                key={month.value}
                variant={selectedMonth === month.value ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter("month", month.value)}
              >
                {month.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
