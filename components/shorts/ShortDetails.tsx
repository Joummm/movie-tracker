// components/shorts/ShortDetails.tsx
"use client";

import {
  Star,
  Calendar,
  Clock,
  Award,
  Clapperboard,
  BookOpen,
  PenTool,
  CheckCircle,
  Repeat,
  Film,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ShortDetailsProps {
  short: any;
  details: any;
  stats: any;
}

export function ShortDetails({ short, details, stats }: ShortDetailsProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;

    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < fullStars
                ? "text-yellow-500 fill-yellow-500"
                : i === fullStars && hasHalfStar
                  ? "text-yellow-500 fill-yellow-500/50"
                  : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 font-bold">{rating.toFixed(1)}/10</span>
      </div>
    );
  };

  const shortTypeLabels: Record<string, string> = {
    animation: "Animação",
    live_action: "Live Action",
    documentary: "Documentário",
    experimental: "Experimental",
    art: "Arte",
    student: "Estudante",
    silent: "Mudo",
    comedy: "Comédia",
    drama: "Drama",
    horror: "Terror",
  };

  return (
    <div className="space-y-8">
      {/* Short Type Badge */}
      {short.short_type && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1.5 border-orange-500/50 text-orange-500 bg-orange-500/10"
          >
            <Clapperboard className="h-3 w-3 mr-1" />
            {shortTypeLabels[short.short_type] || short.short_type}
          </Badge>
          {short.duration && short.duration < 10 && (
            <Badge variant="secondary" className="px-3 py-1.5">
              <Clock className="h-3 w-3 mr-1" />
              Micro-curta ({short.duration}m)
            </Badge>
          )}
        </div>
      )}

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-500" />
            Sinopse e Resenha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {short.review ? (
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {short.review}
              </p>
              {short.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Notas Pessoais
                    </h4>
                    <p className="text-muted-foreground">{short.notes}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground italic">
                Nenhuma resenha adicionada para este curta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Estatísticas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Primeira visualização
                </p>
              </div>
              <p className="text-2xl font-bold">
                {stats.first_watched
                  ? formatDate(stats.first_watched)
                  : "Nunca"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-muted-foreground">
                  Última visualização
                </p>
              </div>
              <p className="text-2xl font-bold">
                {stats.last_watched ? formatDate(stats.last_watched) : "Nunca"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Film className="h-5 w-5 text-purple-500" />
                <p className="text-sm text-muted-foreground">Vezes assistido</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {stats.watch_count}x
              </p>
              <Progress
                value={
                  (stats.watch_count / Math.max(stats.watch_count, 10)) * 100
                }
                className="mt-3"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-muted-foreground">Reassistido</p>
              </div>
              <p className="text-3xl font-bold text-amber-600">
                {stats.rewatch_count}x
              </p>
              <Progress
                value={Math.min(stats.rewatch_count * 20, 100)}
                className="mt-3"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cast Preview */}
      {details.actors && details.actors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Elenco Principal
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {details.actors.length} atores no total
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {details.actors.slice(0, 5).map((actorItem: any) => (
                <Badge key={actorItem.id} variant="outline" className="gap-2">
                  {actorItem.actor?.name}
                  {actorItem.character_name && (
                    <span className="text-muted-foreground text-xs">
                      como {actorItem.character_name}
                    </span>
                  )}
                </Badge>
              ))}
              {details.actors.length > 5 && (
                <Badge variant="secondary">
                  +{details.actors.length - 5} mais
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Recommendations */}
      {(short.would_recommend || short.would_rewatch) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {short.would_recommend && (
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h4 className="font-semibold text-emerald-700">
                      Recomendado
                    </h4>
                    <p className="text-sm text-emerald-600">
                      Você recomendaria este curta para outros espectadores.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {short.would_rewatch && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Repeat className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-700">
                      Para reassistir
                    </h4>
                    <p className="text-sm text-blue-600">
                      Você gostaria de reassistir este curta no futuro.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Rating Display */}
      {short.rating && short.rating > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Sua Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {renderStars(short.rating)}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Classificação
                </span>
                <span className="font-semibold">
                  {short.rating >= 8.5
                    ? "Excelente"
                    : short.rating >= 7
                      ? "Bom"
                      : short.rating >= 5
                        ? "Regular"
                        : "Ruim"}
                </span>
              </div>
              <Progress value={(short.rating / 10) * 100} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
