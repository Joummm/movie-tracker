// components/series/series-details.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Tv, MapPin, FileText, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Series } from "@/lib/types/database";

interface SeriesWithStats extends Series {
  stats: {
    total_episodes: number;
    watched_episodes: number;
    total_seasons: number;
    watched_seasons: number;
    completion_percentage: number;
    average_rating?: number;
    total_watch_time: number;
  };
}

interface SeriesDetailsProps {
  series: SeriesWithStats;
}

export function SeriesDetails({ series }: SeriesDetailsProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificada";
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  const getDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Release Year */}
          {series.release_year && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Ano de Lançamento
                </p>
                <p className="font-medium">{series.release_year}</p>
              </div>
            </div>
          )}

          {/* Dates */}
          {(series.start_date || series.end_date) && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="font-medium">
                  {series.start_date ? formatDate(series.start_date) : "?"}
                  {" - "}
                  {series.end_date ? formatDate(series.end_date) : "?"}
                </p>
              </div>
            </div>
          )}

          {/* Duration */}
          {series.total_watch_time > 0 && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Duração Total</p>
                <p className="font-medium">
                  {getDurationText(series.total_watch_time)}
                </p>
              </div>
            </div>
          )}

          {/* Seasons */}
          <div className="flex items-center gap-3">
            <Tv className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Temporadas</p>
              <p className="font-medium">
                {series.stats.total_seasons} ({series.stats.watched_seasons}{" "}
                completas)
              </p>
            </div>
          </div>

          {/* Episodes */}
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Episódios</p>
              <p className="font-medium">
                {series.stats.total_episodes} ({series.stats.watched_episodes}{" "}
                assistidos)
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Informações Adicionais
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {series.has_special_seasons && (
              <Badge variant="outline">Temporadas Especiais</Badge>
            )}
            {series.would_recommend !== null && (
              <Badge variant={series.would_recommend ? "default" : "secondary"}>
                {series.would_recommend ? "Recomendaria" : "Não Recomendaria"}
              </Badge>
            )}
            {series.would_rewatch !== null && (
              <Badge variant={series.would_rewatch ? "default" : "secondary"}>
                {series.would_rewatch
                  ? "Assistiria Novamente"
                  : "Não Assistiria Novamente"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
