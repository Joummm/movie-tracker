// ==================
// ENUMS / TYPES
// ==================

export type ContentType =
  | "movie"
  | "short"
  | "episode"
  | "podcast_episode"
  | "other";
export type DatePrecision = "full" | "month" | "year" | "unknown";
export type SeriesStatus = "in_progress" | "abandoned" | "completed";
export type PodcastStatus = "in_progress" | "abandoned" | "completed";
export type RoleType =
  | "actor"
  | "director"
  | "writer"
  | "producer"
  | "composer"
  | "cinematographer";

export type CollectionType = "custom" | "franchise" | "anthology" | "universe";

// ==================
// PROFILE
// ==================

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

// ==================
// CONTENT
// ==================

export interface Content {
  id: string;
  user_id: string;
  type: ContentType;
  name?: string;
  cover_image?: string;
  release_year?: number;
  rating?: number;
  duration?: number;
  series_id?: string;
  season?: number;
  episode?: number;
  watched_date?: string;
  watched_year?: number;
  watched_month?: number;
  watched_day?: number;
  date_unknown: boolean;
  notes?: string;
  review?: string;
  created_at: string;
  updated_at: string;
  podcast_id?: string;
  series?: Series;
  podcast?: Podcast;
}

// ==================
// CONTENT VIEWINGS (rewatches / history)
// ==================

export interface ContentViewing {
  id: string;
  content_id: string;
  watched_date?: string;
  watched_year?: number;
  watched_month?: number;
  date_precision: DatePrecision;
  date_unknown: boolean;
  rating?: number;
  notes?: string;
  created_at: string;
}

// ==================
// SERIES
// ==================

export interface Series {
  id: string;
  user_id: string;
  name?: string;
  cover_image?: string;
  release_year?: number;
  status: SeriesStatus;
  total_seasons: number;
  total_episodes: number;
  created_at: string;
  updated_at: string;
}

// ==================
// SERIES SEASONS
// ==================

export interface SeriesSeason {
  id: string;
  series_id: string;
  season_number: number;
  name?: string;
  episode_count: number;
  created_at: string;
  episodes?: SeriesEpisode[];
}

// ==================
// SERIES EPISODES
// ==================

export interface SeriesEpisode {
  id: string;
  series_id: string;
  season_id: string;
  episode_number: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  content_id?: string;
  created_at: string;
  updated_at: string;
  season?: SeriesSeason;
  content?: Content;
}

// ==================
// ACTORS
// ==================

export interface Actor {
  id: string;
  user_id: string;
  name: string;
  photo_url?: string;
  birth_date?: string;
  death_date?: string;
  nationality?: string;
  gender?: string;
  biography?: string;
  tmdb_id?: string;
  imdb_id?: string;
  created_at: string;
  updated_at: string;
}

// ==================
// CONTENT ACTORS
// ==================

export interface ContentActor {
  id: string;
  content_id?: string;
  series_id?: string;
  actor_id: string;
  role_name?: string;
  created_at: string;
  actor?: Actor;
  content?: Content;
  series?: Series;
}

// ==================
// PODCASTS
// ==================

export interface Podcast {
  id: string;
  user_id: string;
  name?: string;
  cover_image?: string;
  release_year?: number;
  status: PodcastStatus;
  description?: string;
  host?: string;
  created_at: string;
  updated_at: string;
  episodes?: PodcastEpisode[];
}

// ==================
// PODCAST EPISODES
// ==================

export interface PodcastEpisode {
  id: string;
  user_id: string;
  podcast_id: string;
  name?: string;
  episode_number?: number;
  season: number;
  cover_image?: string;
  rating?: number;
  duration?: number;
  watched_date?: string;
  watched_year?: number;
  watched_month?: number;
  date_precision: DatePrecision;
  date_unknown: boolean;
  notes?: string;
  review?: string;
  created_at: string;
  updated_at: string;
  podcast?: Podcast;
}

// ==================
// COLLECTIONS
// ==================

export interface Collection {
  id: string;
  user_id: string;
  name?: string;
  description?: string;
  cover_image?: string;
  collection_type: CollectionType;
  created_at: string;
  updated_at: string;
  items?: CollectionItem[];
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  content_id?: string;
  series_id?: string;
  podcast_id?: string;
  position: number;
  created_at: string;
  content?: Content;
  series?: Series;
  podcast?: Podcast;
}

// ==================
// LISTS
// ==================

export interface List {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items?: ListItem[];
}

export interface ListItem {
  id: string;
  list_id: string;
  content_id?: string;
  series_id?: string;
  position: number;
  added_at: string;
  notes?: string;
  content?: Content;
  series?: Series;
}

// ==================
// EXTENDED TYPES (atualizado)
// ==================

// Tipo estendido para Content com relacionamentos completos
export interface ContentWithSeries extends Content {
  series?: Series;
  seasons?: SeriesSeason[];
  podcast?: Podcast; // Adicionado
}

// Tipo para PodcastEpisode com dados de podcast
export interface PodcastEpisodeWithPodcast extends PodcastEpisode {
  podcast?: Podcast;
}

// Tipo para Series com episódios
export interface SeriesWithEpisodes extends Series {
  episodes?: SeriesEpisode[];
  seasons?: SeriesSeason[];
}

// Tipo para ListItem com relacionamentos completos
export interface ListItemWithContent extends ListItem {
  content?: ContentWithSeries;
  series?: SeriesWithEpisodes;
}
