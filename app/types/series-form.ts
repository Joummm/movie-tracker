// app/types/series-form.ts
export interface SeriesFormData {
  name: string;
  cover_image: string;
  release_year: string;
  status: "in_progress" | "abandoned" | "completed";
  poster_vertical: string;
  poster_horizontal: string;
  would_recommend: boolean | null;
  would_rewatch: boolean | null;
  has_special_seasons: boolean;
  start_date: string;
  end_date: string;
  description: string;
}
