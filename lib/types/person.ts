// lib/types/person.ts
export type PersonRole =
  | "actor"
  | "director"
  | "writer"
  | "producer"
  | "host"
  | "other";

export interface Person {
  id: string;
  user_id: string;
  name: string;
  photo_url?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  nationality?: string | null;
  biography?: string | null;
  gender?: string | null;
  tmdb_id?: string | null;
  imdb_id?: string | null;
  role: PersonRole;
  is_main_person: boolean;
  known_for_department?: string | null;
  popularity?: number | null;
  place_of_birth?: string | null;
  also_known_as?: string[] | null;
  created_at: string;
  updated_at: string;

  // Propriedades computadas
  total_credits?: number;
  movies_count?: number;
  series_count?: number;
  shorts_count?: number;
  podcasts_count?: number;
  other_count?: number;
}

export interface PersonCredit {
  id: string;
  content_id?: string | null;
  series_id?: string | null;
  podcast_id?: string | null;
  actor_id: string;
  original_role_name?: string | null;
  character_name?: string | null;
  is_main_cast: boolean;
  credit_order?: number | null;
  episode_count?: number | null;
  created_at: string;

  // Informações relacionadas
  content_name?: string | null;
  content_cover_image?: string | null;
  content_type?: string | null;
  content_subtype?: string | null;
  release_year?: number | null;
  rating?: number | null;
}
