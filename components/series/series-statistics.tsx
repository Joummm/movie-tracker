// components/series/series-statistics.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Star, 
  Target,
  Percent
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SeriesStats {
  total_episodes: number;
  watched_episodes: number;
  total_seasons: number;
  watched_seasons: number;
  completion_percentage: number;
  average_rating?: number;
  total_watch_time: number;
}

interface SeriesStatisticsProps {
  stats: SeriesStats;
}

export function SeriesStatistics({ stats }: SeriesStatisticsProps) {
  const remainingEpisodes = stats.total_episodes - stats.watched_episodes;
  const remainingSeasons = stats.total_seasons - stats.watched_seasons;
  const averageHours = Math.round(stats.total_watch_time / 60);
  const averagePerEpisode = stats.watched_episodes > 0 
    ? Math.round(stats.total_watch_time / stats.watched_episodes) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso Total</span>
            <span className="text-sm font-semibold">{stats.completion_percentage}%</span>
          </div>
          <Progress value={stats.completion_percentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-3 w-3" />
              Concluído
            </div>
            <div className="text-2xl font-bold">
              {stats.watched_episodes}/{stats.total_episodes}
            </div>
            <div className="text-xs text-muted-foreground">
              {remainingEpisodes} episódios restantes
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Temporadas
            </div>
            <div className="text-2xl font-bold">
              {stats.watched_seasons}/{stats.total_seasons}
            </div>
            <div className="text-xs text-muted-foreground">
              {remainingSeasons} temporadas restantes
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Tempo Total
            </div>
            <div className="text-2xl font-bold">{averageHours}h</div>
            <div className="text-xs text-muted-foreground">
              ~{averagePerEpisode}min/episódio
            </div>
          </div>

          {stats.average_rating && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Avaliação Média
              </div>
              <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">de 10</div>
            </div>
          )}
        </div>

        {/* Season Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Temporadas Concluídas</span>
            <span className="text-sm font-semibold">
              {Math.round((stats.watched_seasons / stats.total_seasons) * 100) || 0}%
            </span>
          </div>
          <Progress 
            value={Math.round((stats.watched_seasons / stats.total_seasons) * 100) || 0} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
}