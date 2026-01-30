// components/series/series-card.tsx
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Play,
  CheckCircle2,
  Calendar,
  Tv2,
  Star,
  Clock,
  Users,
  Eye,
  Pencil,
  Layers,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SeriesWithStats } from "@/lib/types/series";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SeriesCardProps {
  series: SeriesWithStats;
  viewMode: "grid" | "list";
  user: User;
  onStatusChange?: () => void;
}

// Componente Progress customizado com gradiente
function GradientProgress({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-2.5 rounded-full bg-muted/50 overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-linear-to-r from-primary/20 via-primary/10 to-blue-500/20 rounded-full blur-sm" />
      <div
        className="h-full rounded-full bg-linear-to-r from-primary via-blue-500 to-cyan-500 transition-all duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// Configuração dos status
const STATUS_CONFIG = {
  in_progress: {
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    icon: <Play className="h-3 w-3" />,
    label: "Em Progresso",
    description: "Estou assistindo esta série atualmente",
  },
  completed: {
    color: "bg-emerald-500",
    hoverColor: "hover:bg-emerald-600",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Completada",
    description: "Terminei de assistir toda a série",
  },
  abandoned: {
    color: "bg-rose-500",
    hoverColor: "hover:bg-rose-600",
    icon: <X className="h-3 w-3" />,
    label: "Abandonada",
    description: "Parei de assistir esta série",
  },
  // planned: {
  //   color: "bg-purple-500",
  //   hoverColor: "hover:bg-purple-600",
  //   icon: <Calendar className="h-3 w-3" />,
  //   label: "Planejada",
  //   description: "Planeio assistir esta série no futuro"
  // }
};

export function SeriesCard({
  series,
  viewMode,
  user,
  onStatusChange,
}: SeriesCardProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(series.status);
  const supabase = createClient();

  const status =
    STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.in_progress;
  const totalSeasons = series.total_seasons || series.seasons?.length || 0;
  const watchedSeasons = series.stats?.watched_seasons || 0;

  // Função para alterar o status da série
  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingStatus || currentStatus === newStatus) return;

    setIsUpdatingStatus(true);

    try {
      // Atualiza no Supabase
      const { error } = await supabase
        .from("series")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === "completed" && {
            end_date: new Date().toISOString().split("T")[0],
          }),
        })
        .eq("id", series.id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Atualiza o estado local
      setCurrentStatus(
        newStatus as "in_progress" | "abandoned" | "completed" | "planned",
      );

      // Mostra notificação de sucesso
      toast.success(
        `Status alterado para "${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label}"`,
        {
          description: `A série "${series.name || "Série sem nome"}" foi atualizada.`,
        },
      );

      // Chama o callback para atualizar a lista
      if (onStatusChange) {
        setTimeout(() => {
          onStatusChange();
        }, 500);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status", {
        description:
          "Não foi possível alterar o status da série. Tente novamente.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Função para navegar para a página da série ao clicar no card
  const handleCardClick = (e: React.MouseEvent) => {
    // Evita navegação se clicar em elementos interativos
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest('[role="menuitem"]') ||
      (e.target as HTMLElement).closest(".status-badge-container")
    ) {
      return;
    }
    router.push(`/series/${series.id}`);
  };

  // Componente do badge de status interativo
  const StatusBadge = () => (
    <div
      className="status-badge-container"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer">
            <Badge
              className={cn(
                "border-none text-white shadow-md px-3 py-1.5 transition-all duration-200",
                status.color,
                status.hoverColor,
                "hover:shadow-lg",
                isUpdatingStatus && "opacity-70",
              )}
            >
              <div className="flex items-center gap-1.5">
                {isUpdatingStatus ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    {status.icon}
                    <span className="font-semibold text-xs tracking-wide">
                      {status.label}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-1 opacity-80" />
                  </>
                )}
              </div>
            </Badge>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-primary font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Alterar Status
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const isCurrent = currentStatus === key;
            const isDisabled = isCurrent || isUpdatingStatus;

            return (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusChange(key)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-3 py-3",
                  isCurrent && "bg-primary/10",
                  !isDisabled && "cursor-pointer hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    config.color,
                    "text-white",
                  )}
                >
                  {config.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-medium",
                        isCurrent && "text-primary font-semibold",
                      )}
                    >
                      {config.label}
                    </span>
                    {isCurrent && (
                      <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {config.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">
              Clique para alterar o status da série
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Componente do botão de status (para vista de lista)
  const StatusButton = () => (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/10",
              "transition-all duration-200",
            )}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <div className={cn("h-2 w-2 rounded-full", status.color)} />
                <span>{status.label}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-primary font-semibold">
            Status da Série
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => handleStatusChange(key)}
              disabled={currentStatus === key || isUpdatingStatus}
              className={cn(
                "flex items-center gap-2 py-2.5",
                currentStatus === key && "bg-primary/10",
              )}
            >
              <div className={cn("h-2 w-2 rounded-full", config.color)} />
              <span className="flex-1">{config.label}</span>
              {currentStatus === key && (
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (viewMode === "grid") {
    return (
      <Card
        className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Container da imagem de capa */}
        <div className="relative aspect-3/4 overflow-hidden rounded-t-xl">
          {series.cover_image ? (
            <div className="relative h-full w-full">
              <Image
                src={series.cover_image}
                alt={series.name || "Série"}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={false}
              />
              {/* Overlay gradiente */}
              <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/30 to-transparent" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-muted to-muted/50">
              <Tv2 className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          {/* Badges no topo */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <Badge className="bg-background/90 backdrop-blur-sm border-border/50 shadow-sm">
              <div className="flex items-center gap-1 text-white">
                <Layers className="h-3 w-3" />
                <span className="font-medium">{totalSeasons} temp</span>
              </div>
            </Badge>

            <StatusBadge />
          </div>

          {/* Informações na parte inferior da imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background/95 via-background/80 to-transparent">
            <div className="flex items-center justify-between">
              {series.stats?.average_rating &&
              series.stats.average_rating > 0 ? (
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span className="font-bold text-sm">
                      {series.stats.average_rating.toFixed(1)}
                    </span>
                  </div>
                </Badge>
              ) : (
                <Badge variant="outline">
                  <span className="text-muted-foreground text-sm">
                    Sem avaliação
                  </span>
                </Badge>
              )}

              {series.release_year && (
                <Badge variant="outline">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-sm">{series.release_year}</span>
                  </div>
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          <div className="space-y-3">
            {/* Título e descrição */}
            <div>
              <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors duration-300">
                {series.name || "Série sem nome"}
              </h3>
            </div>

            {/* Seção de progresso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Progresso</span>
                </div>
                <span className="text-sm font-semibold">
                  {series.stats?.watched_episodes || 0}/
                  {series.stats?.total_episodes || 0}
                </span>
              </div>

              <GradientProgress
                value={series.stats?.completion_percentage || 0}
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{series.stats?.total_watch_hours || 0}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {watchedSeasons}/{totalSeasons} temp
                    </span>
                  </div>
                </div>
                <span className="font-semibold text-primary">
                  {series.stats?.completion_percentage || 0}%
                </span>
              </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1">Episódios</p>
                <p className="text-lg font-bold">
                  {series.stats?.total_episodes || 0}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1">Assistidos</p>
                <p className="text-lg font-bold text-primary">
                  {series.stats?.watched_episodes || 0}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1">Tempo</p>
                <p className="text-lg font-bold">
                  {series.stats?.total_watch_hours || 0}h
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter
          className="p-5 pt-0 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            onClick={() => router.push(`/series/${series.id}`)}
          >
            <Eye className="h-4 w-4" />
            Ver Detalhes
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-primary font-semibold">
                Ações Rápidas
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/series/${series.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Série
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/series/${series.id}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar Série
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => router.push(`/series/${series.id}/seasons`)}>
                <Layers className="h-4 w-4 mr-2" />
                Gerenciar Temporadas
              </DropdownMenuItem> */}
              {/* <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/series/${series.id}/cast`)}>
                <Users className="h-4 w-4 mr-2" />
                Elenco
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    );
  }

  // List View
  return (
    <Card
      className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex relative">
        {/* Imagem de capa - estilo sidebar */}
        <div className="relative w-28 md:w-36 h-40 md:h-48 shrink-0">
          {series.cover_image ? (
            <div className="relative h-full w-full">
              <Image
                src={series.cover_image}
                alt={series.name || "Série"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100px, 150px"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-muted to-muted/50">
              <Tv2 className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}

          {/* Status badge na imagem */}
          <div
            className="absolute bottom-2 left-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="status-badge-container">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="cursor-pointer">
                    <Badge
                      className={cn(
                        "border-none text-white shadow-md text-xs px-3 py-1.5",
                        status.color,
                        status.hoverColor,
                        "hover:shadow-lg transition-all duration-200",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {isUpdatingStatus ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            {status.icon}
                            <span>{status.label}</span>
                          </>
                        )}
                      </div>
                    </Badge>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-primary font-semibold">
                    Alterar Status
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      disabled={currentStatus === key || isUpdatingStatus}
                      className={cn(
                        "flex items-center gap-2 py-2.5",
                        currentStatus === key && "bg-primary/10",
                      )}
                    >
                      <div
                        className={cn("h-2 w-2 rounded-full", config.color)}
                      />
                      <span className="flex-1">{config.label}</span>
                      {currentStatus === key && (
                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 p-5 md:p-6">
          <div className="flex flex-col h-full">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">
                    {series.name || "Série sem nome"}
                  </h3>
                  {series.stats?.average_rating &&
                    series.stats.average_rating > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-1" />
                        <span className="font-bold text-sm">
                          {series.stats.average_rating.toFixed(1)}
                        </span>
                      </Badge>
                    )}
                </div>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-primary font-semibold">
                      Ações Rápidas
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push(`/series/${series.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Série
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/series/${series.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar Série
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem onClick={() => router.push(`/series/${series.id}/seasons`)}>
                      <Layers className="h-4 w-4 mr-2" />
                      Gerenciar Temporadas
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Grid de estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-muted/20 rounded-lg p-3 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Progresso
                </p>
                <p className="text-lg font-bold">
                  {series.stats?.watched_episodes || 0}/
                  {series.stats?.total_episodes || 0}
                </p>
              </div>

              <div className="bg-muted/20 rounded-lg p-3 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Temporadas
                </p>
                <p className="text-lg font-bold">
                  {watchedSeasons}/{totalSeasons}
                </p>
              </div>

              <div className="bg-muted/20 rounded-lg p-3 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Tempo Total
                </p>
                <p className="text-lg font-bold">
                  {series.stats?.total_watch_hours || 0}h
                </p>
              </div>

              <div className="bg-muted/20 rounded-lg p-3 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Ano
                </p>
                <p className="text-lg font-bold">
                  {series.release_year || "-"}
                </p>
              </div>
            </div>

            {/* Seção de progresso */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Progresso da Série
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {series.stats?.completion_percentage || 0}% concluído
                </span>
              </div>

              <GradientProgress
                value={series.stats?.completion_percentage || 0}
              />
            </div>

            {/* Ações do rodapé */}
            <div
              className="flex items-center justify-between pt-5 border-t border-border/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <StatusButton />

                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 hover:bg-primary/10 hover:text-primary"
                  onClick={() => router.push(`/series/${series.id}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </div>

              <Button
                size="sm"
                className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                onClick={() => router.push(`/series/${series.id}`)}
              >
                Ver Detalhes
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
