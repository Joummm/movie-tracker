// lib/types/shorts.ts
import { Content } from "./database";

export type WatchStatus =
  | "completed"
  | "watching"
  | "planned"
  | "rewatching"
  | "abandoned";

export interface Short extends Omit<Content, "type"> {
  type: "short";
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
  short_type?: "animation" | "live_action" | "documentary" | "experimental";
  festival_awards?: string[];
  runtime_category?: "micro" | "short" | "medium";
}

export interface ShortFilters {
  search?: string;
  year?: number;
  watch_status?: string;
  sort_by?: "recent" | "rating" | "name" | "year" | "duration" | "watch_date";
  sort_order?: "asc" | "desc";
  short_type?: string;
}

export interface ShortWithStats {
  id: string;
  name?: string;
  cover_image?: string;
  rating?: number;
  duration?: number;
  release_year?: number;
  watch_status: string;
  watched_date?: string;
  created_at: string;
  updated_at: string;
  short_type?: string;
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

export interface ShortStats {
  total_shorts: number;
  total_watch_time: number;
  average_rating: number;
  average_duration: number;
  by_year: Record<number, number>;
  by_genre: Record<string, number>;
  by_type: Record<string, number>;
  by_director: Record<string, number>;
  by_country: Record<string, number>;
  by_language: Record<string, number>;
  watch_status_distribution: Record<WatchStatus, number>;
  rating_distribution: Record<number, number>;
  monthly_stats: Array<{ month: string; count: number; total_time: number }>;
}
