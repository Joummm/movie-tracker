// components/series/series-overview.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle,
  TrendingUp
} from "lucide-react";
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

interface SeriesOverviewProps {
  series: SeriesWithStats;
}

export function SeriesOverview({ series }: SeriesOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sobre a Série</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {series.description && (
          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {series.description}
            </p>
          </div>
        )}

        <Separator />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Progresso
            </div>
            <div className="text-2xl font-bold">
              {series.stats.completion_percentage}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Tempo Total
            </div>
            <div className="text-2xl font-bold">
              {Math.round(series.stats.total_watch_time / 60)}h
            </div>
          </div>

          {series.stats.average_rating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                Avaliação
              </div>
              <div className="text-2xl font-bold">
                {series.stats.average_rating.toFixed(1)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Episódios
            </div>
            <div className="text-2xl font-bold">
              {series.stats.watched_episodes}/{series.stats.total_episodes}
            </div>
          </div>
        </div>

        <Separator />

        {/* Preferences */}
        <div>
          <h3 className="font-semibold mb-3">Preferências</h3>
          <div className="flex flex-wrap gap-2">
            {series.would_recommend !== null && (
              <Badge variant={series.would_recommend ? "default" : "secondary"}>
                {series.would_recommend ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Recomendaria
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Não Recomendaria
                  </>
                )}
              </Badge>
            )}
            
            {series.would_rewatch !== null && (
              <Badge variant={series.would_rewatch ? "default" : "secondary"}>
                {series.would_rewatch ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Assistiria Novamente
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Não Assistiria Novamente
                  </>
                )}
              </Badge>
            )}
            
            {series.has_special_seasons && (
              <Badge variant="outline">
                Tem Temporadas Especiais
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}