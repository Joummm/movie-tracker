// lib/types/movies.ts
import { Content, ContentWithRelations, ContentType } from "./database";

// Defina WatchStatus se não existir em database.ts
export type WatchStatus =
  | "completed"
  | "watching"
  | "planned"
  | "rewatching"
  | "abandoned";

export interface Movie extends Omit<Content, "type"> {
  type: "movie";
  director?: string;
  release_date?: string;
  release_year?: number;
  studio?: string;
  budget?: number;
  revenue?: number;
  awards?: string[];
  imdb_id?: string;
  tmdb_id?: string;
  language?: string;
  country?: string;
  aspect_ratio?: string;
  color_mode?: string;
  sound_mix?: string;
  certificate?: string;
  tagline?: string;
  quotes?: string[];
  soundtrack?: string[];
  filming_locations?: string[];
  trivia?: string[];
}

// lib/types/movies.ts
export interface MovieFilters {
  search?: string;
  year?: number;
  watch_status?: string; // Mude de WatchStatus para string se necessário
  sort_by?: "recent" | "rating" | "name" | "year" | "duration" | "watch_date";
  sort_order?: "asc" | "desc";
}

export interface MovieWithStats {
  id: string;
  name?: string;
  cover_image?: string;
  rating?: number;
  duration?: number;
  release_year?: number;
  watch_status: string; // Mude de WatchStatus para string
  watched_date?: string;
  created_at: string;
  updated_at: string;
  stats?: {
    watch_count: number;
    total_watch_time: number;
    average_rating: number;
    rewatch_count: number;
    first_watched?: string;
    last_watched?: string;
    days_since_last_watch?: number;
  };
  actors?: any[];
  genres?: any[];
  viewings?: any[];
}

export interface MovieStats {
  total_movies: number;
  total_watch_time: number;
  average_rating: number;
  average_duration: number;
  by_year: Record<number, number>;
  by_genre: Record<string, number>;
  by_decade: Record<string, number>;
  by_director: Record<string, number>;
  by_country: Record<string, number>;
  by_language: Record<string, number>;
  watch_status_distribution: Record<WatchStatus, number>;
  rating_distribution: Record<number, number>;
  monthly_stats: Array<{ month: string; count: number; total_time: number }>;
}
