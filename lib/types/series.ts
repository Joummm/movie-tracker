// lib/types/series.ts
export type SeriesStatus = 'in_progress' | 'abandoned' | 'completed' | 'planned';

export interface SeriesEpisode {
  id: string;
  episode_number: number;
  name?: string;
  duration?: number;
  is_watched: boolean;
  watched_date?: string;
  rating?: number;
}

export interface SeriesSeason {
  id: string;
  season_number: number;
  name?: string;
  episode_count: number;
  watched_episode_count: number;
  is_special: boolean;
  total_watch_time: number;
  average_rating?: number;
  episodes?: SeriesEpisode[];
}

export interface SeriesStats {
  total_episodes: number;
  watched_episodes: number;
  total_seasons: number;
  watched_seasons: number;
  completion_percentage: number;
  average_rating?: number;
  total_watch_time: number; // em minutos
  total_watch_hours: number; // calculado
}

export interface SeriesWithStats {
  id: string;
  user_id: string;
  name?: string;
  cover_image?: string;
  release_year?: number;
  status: SeriesStatus; // Usar o tipo específico
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

  seasons?: SeriesSeason[];
  stats: SeriesStats;
}
export interface StatusCounts {
  all: number;
  in_progress: number;
  completed: number;
  abandoned: number;
  planned: number;
}