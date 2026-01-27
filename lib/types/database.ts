export type ContentType = "movie" | "short" | "episode" | "other"
export type SeriesStatus = "in_progress" | "abandoned" | "completed"
export type DatePrecision = "full" | "month" | "year" | "unknown"
export type CollectionType = "custom" | "franchise" | "universe" | "anthology"

export interface Profile {
  id: string
  display_name: string
  created_at: string
  updated_at: string
}

export interface Series {
  id: string
  user_id: string
  name?: string
  cover_image?: string
  status?: SeriesStatus
  release_year?: number
  created_at: string
  updated_at: string
}

// Series structure for planning episodes before watching
export interface SeriesEpisodeStructure {
  id: string
  series_id: string
  season: number
  episode: number
  name?: string
  duration?: number
  is_watched: boolean
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  user_id: string
  type: ContentType
  name?: string
  cover_image?: string
  rating?: number
  duration?: number
  release_year?: number
  series_id?: string
  season?: number
  episode?: number
  watched_date?: string
  watched_year?: number
  watched_month?: number
  date_precision?: DatePrecision
  notes?: string
  created_at: string
  updated_at: string
  series?: Series
}

export interface ContentWithSeries extends Content {
  series?: Series
}

// Custom Lists
export interface ContentList {
  id: string
  user_id: string
  name: string
  description?: string
  cover_image?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ListItem {
  id: string
  list_id: string
  content_id?: string
  series_id?: string
  position: number
  notes?: string
  created_at: string
  content?: Content
  series?: Series
}
