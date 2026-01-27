export type ContentType = 'movie' | 'short' | 'episode' | 'other'
export type DatePrecision = 'full' | 'month' | 'year' | 'unknown'
export type SeriesStatus = 'in_progress' | 'abandoned' | 'completed'
export type SeriesTrackingStatus = 'not_started' | 'watching' | 'completed' | 'abandoned' | 'on_hold'
export type PodcastStatus = 'in_progress' | 'abandoned' | 'completed'
export type RoleType = 'actor' | 'director' | 'writer' | 'producer' | 'composer' | 'cinematographer'
export type ContentGroupType = 'collection' | 'franchise' | 'anthology' | 'universe'

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
  release_year?: number
  status: SeriesStatus
  tracking_status: SeriesTrackingStatus
  current_season: number
  current_episode: number
  total_seasons: number
  total_episodes: number
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  user_id: string
  type: ContentType
  name?: string
  cover_image?: string
  release_year?: number
  rating?: number
  duration?: number
  series_id?: string
  season?: number
  episode?: number
  watched_date?: string
  watched_year?: number
  watched_month?: number
  watched_day?: number
  date_precision: DatePrecision
  date_unknown: boolean
  notes?: string
  review?: string
  created_at: string
  updated_at: string
}

export interface ContentWithSeries extends Content {
  series?: Series
}

export interface Actor {
  id: string
  user_id: string
  name: string
  photo_url?: string
  birth_date?: string
  death_date?: string
  nationality?: string
  gender: string
  biography?: string
  tmdb_id?: string
  imdb_id?: string
  created_at: string
  updated_at: string
}

export interface ContentActor {
  id: string
  content_id?: string
  series_id?: string
  actor_id: string
  role_name?: string
  created_at: string
  actor?: Actor
  content?: Content
  series?: Series
  actor_roles?: ActorRole[]
}

export interface ActorRole {
  id: string
  content_actor_id: string
  role: RoleType
  character_name?: string
  created_at: string
}

export interface Podcast {
  id: string
  user_id: string
  name?: string
  cover_image?: string
  release_year?: number
  status: PodcastStatus
  description?: string
  host?: string
  created_at: string
  updated_at: string
  episodes?: PodcastEpisode[]
}

export interface PodcastEpisode {
  id: string
  user_id: string
  podcast_id: string
  name?: string
  episode_number: number
  season: number
  cover_image?: string
  rating?: number
  duration?: number
  watched_date?: string
  watched_year?: number
  watched_month?: number
  date_precision: DatePrecision
  date_unknown: boolean
  notes?: string
  review?: string
  created_at: string
  updated_at: string
  podcast?: Podcast
}

export interface Review {
  id: string
  user_id: string
  content_id?: string
  series_id?: string
  podcast_id?: string
  podcast_episode_id?: string
  title?: string
  content: string
  rating?: number
  is_spoiler: boolean
  is_public: boolean
  created_at: string
  updated_at: string
  user?: Profile
  content_item?: Content
  series?: Series
  podcast?: Podcast
  podcast_episode?: PodcastEpisode
}

export interface ContentGroup {
  id: string
  user_id: string
  name?: string
  description?: string
  cover_image?: string
  group_type: ContentGroupType
  created_at: string
  updated_at: string
  items?: ContentGroupItem[]
}

export interface ContentGroupItem {
  id: string
  group_id: string
  content_id?: string
  series_id?: string
  position: number
  created_at: string
  content?: Content
  series?: Series
}

export interface SeriesSeason {
  id: string
  series_id: string
  season_number: number
  name?: string
  description?: string
  release_year?: number
  poster_image?: string
  episode_count: number
  created_at: string
  episodes?: SeriesEpisode[]
}

export interface SeriesEpisode {
  id: string
  series_id: string
  season_id: string
  episode_number: number
  name?: string
  description?: string
  release_date?: string
  duration?: number
  rating?: number
  is_watched: boolean
  watched_date?: string
  watched_rating?: number
  notes?: string
  content_id?: string
  created_at: string
  updated_at: string
  season?: SeriesSeason
  content?: Content
}