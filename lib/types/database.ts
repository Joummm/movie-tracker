// ==================
// ENUMS / TYPES
// ==================

export type ContentType =
  | "movie"
  | "short"
  | "series"
  | "podcast"
  | "other"
  | "episode"
  | "podcast_episode";

export type DatePrecision = "full" | "month" | "year" | "unknown";
export type SeriesStatus =
  | "in_progress"
  | "abandoned"
  | "completed"
  | "planned";
export type PodcastStatus = "in_progress" | "abandoned" | "completed";
export type CollectionType = "custom" | "franchise" | "anthology" | "universe";
export type WatchStatus =
  | "planned"
  | "watching"
  | "completed"
  | "abandoned"
  | "rewatching";
export type PersonRoleType =
  | "actor"
  | "director"
  | "producer"
  | "writer"
  | "composer"
  | "cinematographer"
  | "host"
  | "crew";
export type CrewRole =
  | "director"
  | "producer"
  | "writer"
  | "composer"
  | "cinematographer"
  | "editor"
  | "other";

// ==================
// PROFILE / USER
// ==================

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  preferences: Record<string, any>;
  total_watch_time: number;
  total_content_count: number;
  last_export_date?: string;
  last_import_date?: string;
  theme_preference: "light" | "dark" | "auto";
  created_at: string;
  updated_at: string;
}

// ==================
// PERSON / ACTOR / CREW
// ==================

export interface Person {
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
  role: PersonRoleType;
  is_main_person: boolean;
  known_for_department?: string;
  popularity: number;
  place_of_birth?: string;
  also_known_as: string[];
  created_at: string;
  updated_at: string;
}

// ==================
// GENRES
// ==================

export interface Genre {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

// ==================
// CONTENT (BASE)
// ==================

export interface Content {
  id: string;
  user_id: string;
  name?: string;
  cover_image?: string;
  rating?: number; // 0-10
  duration?: number; // in minutes
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
  release_year?: number;
  type: ContentType;
  season_id?: string;
  episode_number?: number;
  would_recommend?: boolean;
  would_rewatch?: boolean;
  watch_status: WatchStatus;
  rewatch_count: number;
  last_rewatch_date?: string;
  content_subtype?: string;
}

// ==================
// CONTENT VIEWINGS (rewatches / watch history)
// ==================

export interface ContentViewing {
  id: string;
  content_id: string;
  watched_date?: string;
  watched_year?: number;
  watched_month?: number;
  date_precision: DatePrecision;
  date_unknown: boolean;
  rating?: number; // 0-10
  notes?: string;
  created_at: string;
  episode_id?: string;
  podcast_episode_id?: string;
  watch_session_id?: string;
  platform?: string;
  device?: string;
  duration_watched?: number;
}

// ==================
// CONTENT ACTORS (Cast)
// ==================

export interface ContentActor {
  id: string;
  content_id?: string;
  series_id?: string;
  actor_id: string;
  original_role_name?: string;
  character_name?: string;
  is_main_cast: boolean;
  credit_order?: number;
  episode_count?: number;
  created_at: string;
  actor?: Person;
  content?: Content;
  series?: Series;
}

// ==================
// CONTENT CREW (Directors, Producers, etc.)
// ==================

export interface ContentCrew {
  id: string;
  content_id: string;
  person_id: string;
  role: CrewRole;
  job_title?: string;
  department?: string;
  created_at: string;
  person?: Person;
  content?: Content;
}

// ==================
// CONTENT GENRES
// ==================

export interface ContentGenre {
  id: string;
  content_id: string;
  genre_id: string;
  created_at: string;
  genre?: Genre;
  content?: Content;
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
  description?: string;
  created_at: string;
  updated_at: string;
  poster_vertical?: string;
  poster_horizontal?: string;
  would_recommend?: boolean;
  would_rewatch?: boolean;
  average_rating?: number;
  total_watch_time: number;
  has_special_seasons: boolean;
  start_date?: string;
  end_date?: string;
}

// ==================
// SERIES SEASONS
// ==================

export interface SeriesSeason {
  id: string;
  series_id: string;
  user_id: string;
  season_number: number;
  name?: string;
  episode_count: number;
  watched_episode_count: number;
  created_at: string;
  updated_at: string;
  is_special: boolean;
  special_type?: string;
  poster_vertical?: string;
  poster_horizontal?: string;
  release_year?: number;
  average_rating?: number;
  total_watch_time: number;
  series?: Series;
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
  would_recommend?: boolean;
  would_rewatch?: boolean;
  rewatch_count: number;
  last_rewatch_date?: string;
  release_date?: string;
  rating?: number;
  review?: string;
  season?: SeriesSeason;
  series?: Series;
  content?: Content;
}

// ==================
// SERIES EPISODE STRUCTURE (Template)
// ==================

export interface SeriesEpisodeStructure {
  id: string;
  series_id: string;
  season: number;
  episode: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  release_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ==================
// SERIES CAST
// ==================

export interface SeriesCast {
  id: string;
  series_id: string;
  actor_id: string;
  character_name: string;
  is_main_cast: boolean;
  episode_count?: number;
  season_range?: string;
  notes?: string;
  created_at: string;
  actor?: Person;
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
  poster_vertical?: string;
  poster_horizontal?: string;
  would_recommend?: boolean;
  would_rewatch?: boolean;
  average_rating?: number;
  total_listen_time: number;
  start_date?: string;
  end_date?: string;
  language?: string;
  website_url?: string;
  rss_feed?: string;
  episodes?: PodcastEpisode[];
  hosts?: PodcastHost[];
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
  would_recommend?: boolean;
  would_rewatch?: boolean;
  rewatch_count: number;
  last_rewatch_date?: string;
  guest_hosts: string[];
  episode_url?: string;
  transcript?: string;
  podcast?: Podcast;
}

// ==================
// PODCAST HOSTS
// ==================

export interface PodcastHost {
  id: string;
  podcast_id: string;
  person_id: string;
  role: string;
  start_date?: string;
  end_date?: string;
  episode_count: number;
  created_at: string;
  updated_at: string;
  person?: Person;
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
  podcast_id?: string;
  position: number;
  added_at: string;
  notes?: string;
  content?: Content;
  series?: Series;
  podcast?: Podcast;
}

// ==================
// WATCH SESSIONS
// ==================

export interface WatchSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  platform?: string;
  device?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================
// DATA TRANSFERS (Import/Export)
// ==================

export interface DataTransfer {
  id: string;
  user_id: string;
  transfer_type: "import" | "export";
  file_name?: string;
  file_size_bytes?: number;
  content_count: number;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

// ==================
// USER GOALS
// ==================

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "failed" | "abandoned";
  title: string;
  description?: string;
  reward?: string;
  created_at: string;
  updated_at: string;
}

// ==================
// USER STATISTICS
// ==================

export interface UserStatistics {
  id: string;
  user_id: string;
  stat_date: string;
  stat_type: string;
  movies_watched: number;
  series_watched: number;
  episodes_watched: number;
  shorts_watched: number;
  podcasts_listened: number;
  other_watched: number;
  total_watch_time: number;
  average_daily_watch_time: number;
  average_rating: number;
  highest_rated_content_id?: string;
  lowest_rated_content_id?: string;
  top_genres: Record<string, any>[];
  rewatch_count: number;
  recommended_count: number;
  created_at: string;
  updated_at: string;
}

// ==================
// EXTENDED TYPES (for UI/API responses)
// ==================

// Content with all relationships
export interface ContentWithRelations extends Content {
  series?: Series;
  seasons?: SeriesSeason[];
  podcast?: Podcast;
  actors?: ContentActor[];
  crew?: ContentCrew[];
  genres?: ContentGenre[];
  viewings?: ContentViewing[];
}

// Series with all relationships
export interface SeriesWithRelations extends Series {
  seasons?: SeriesSeason[];
  episodes?: SeriesEpisode[];
  structure?: SeriesEpisodeStructure[];
  cast?: SeriesCast[];
  content?: Content[];
}

// Person with all relationships
export interface PersonWithRelations extends Person {
  content_actors?: ContentActor[];
  content_crew?: ContentCrew[];
  series_cast?: SeriesCast[];
  podcast_hosts?: PodcastHost[];
}

// Series with statistics
export interface SeriesWithStats extends Series {
  stats: {
    total_watched: number;
    total_episodes: number;
    completion_percentage: number;
    avg_rating: number;
    total_hours: number;
    seasons_watched: number;
    watched_episodes_by_season: Record<number, number>;
  };
  seasons?: SeriesSeason[];
}

// List with items and relations
export interface ListWithItems extends List {
  items?: (ListItem & {
    content?: ContentWithRelations;
    series?: SeriesWithRelations;
    podcast?: Podcast;
  })[];
}

// Collection with items and relations
export interface CollectionWithItems extends Collection {
  items?: (CollectionItem & {
    content?: ContentWithRelations;
    series?: SeriesWithRelations;
    podcast?: Podcast;
  })[];
}

// Dashboard statistics
export interface DashboardStats {
  total_watch_time: number;
  total_content_count: number;
  movies_watched: number;
  series_watched: number;
  episodes_watched: number;
  shorts_watched: number;
  podcasts_listened: number;
  average_rating: number;
  favorite_genres: string[];
  recent_activity: ContentViewing[];
  current_goals: UserGoal[];
  watch_sessions_today: number;
}
