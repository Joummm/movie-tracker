import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Film, 
  Tv, 
  Video, 
  Headphones, 
  Star, 
  Clock, 
  Calendar, 
  Edit, 
  ArrowLeft,
  Users,
  User
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get the content item with actors and related data
  const { data: content } = await supabase
    .from("content")
    .select(`
      *,
      series(*),
      content_actors(
        *,
        actor(*)
      )
    `)
    .eq("id", id)
    .single()

  // If not found in content table, try podcast_episodes
  let podcastContent = null
  if (!content) {
    const { data: podcastEpisode } = await supabase
      .from("podcast_episodes")
      .select(`
        *,
        podcasts(*)
      `)
      .eq("id", id)
      .single()
    
    if (podcastEpisode) {
      podcastContent = {
        ...podcastEpisode,
        type: "podcast_episode" as const,
        episode: podcastEpisode.episode_number,
      }
    }
  }

  const finalContent = content || podcastContent

  if (!finalContent) {
    notFound()
  }

  // Check if user owns this content
  if (finalContent.user_id !== user.id) {
    redirect("/content")
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-6 w-6" />
      case "episode":
        return <Tv className="h-6 w-6" />
      case "podcast_episode":
        return <Headphones className="h-6 w-6" />
      case "short":
        return <Video className="h-6 w-6" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Filme"
      case "episode":
        return "Episódio de Série"
      case "podcast_episode":
        return "Episódio de Podcast"
      case "short":
        return "Short"
      default:
        return "Conteúdo"
    }
  }

  const getDisplayName = () => {
    if (finalContent.name) {
      return finalContent.name
    }
    
    if (finalContent.type === "episode" && finalContent.series) {
      return `${finalContent.series.name} - S${finalContent.season}E${finalContent.episode}`
    }
    
    if (finalContent.type === "podcast_episode" && finalContent.podcast) {
      return `${finalContent.podcast.name} - Ep ${finalContent.episode}`
    }
    
    return "Sem título"
  }

  const getParentInfo = () => {
    if (finalContent.type === "episode" && finalContent.series) {
      return {
        type: "Série",
        name: finalContent.series.name,
        id: finalContent.series.id,
        route: `/series/${finalContent.series.id}`
      }
    }
    
    if (finalContent.type === "podcast_episode" && finalContent.podcast) {
      return {
        type: "Podcast",
        name: finalContent.podcast.name,
        id: finalContent.podcast.id,
        route: `/podcasts/${finalContent.podcast.id}`
      }
    }
    
    return null
  }

  const parentInfo = getParentInfo()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.display_name || "User"} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/content">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Conteúdos
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna esquerda - Imagem e informações básicas */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <div className="relative aspect-2/3 bg-muted rounded-t-lg overflow-hidden">
                {finalContent.cover_image || 
                 finalContent.series?.cover_image || 
                 finalContent.podcast?.cover_image ? (
                  <Image
                    src={finalContent.cover_image || 
                         finalContent.series?.cover_image || 
                         finalContent.podcast?.cover_image}
                    alt={getDisplayName()}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {getIcon(finalContent.type)}
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {getTypeLabel(finalContent.type)}
                  </Badge>
                  
                  {finalContent.duration && (
                    <Badge variant="outline" className="text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {finalContent.duration}min
                    </Badge>
                  )}
                  
                  {(finalContent.release_year || 
                    finalContent.series?.release_year || 
                    finalContent.podcast?.release_year) && (
                    <Badge variant="outline" className="text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {finalContent.release_year || 
                       finalContent.series?.release_year || 
                       finalContent.podcast?.release_year}
                    </Badge>
                  )}
                </div>

                {parentInfo && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">{parentInfo.type}:</p>
                    <Link 
                      href={parentInfo.route}
                      className="text-sm font-medium hover:underline"
                    >
                      {parentInfo.name}
                    </Link>
                  </div>
                )}

                {finalContent.type === "episode" && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Episódio:</p>
                    <p className="text-sm font-medium">
                      Temporada {finalContent.season}, Episódio {finalContent.episode}
                    </p>
                  </div>
                )}

                {finalContent.type === "podcast_episode" && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Episódio:</p>
                    <p className="text-sm font-medium">
                      {finalContent.season && `Temporada ${finalContent.season}, `}
                      Episódio {finalContent.episode}
                    </p>
                  </div>
                )}

                {finalContent.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-lg font-bold">{finalContent.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Assistido em:</p>
                  <p className="text-sm font-medium">
                    {new Date(finalContent.watched_date).toLocaleDateString("pt-PT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <Button asChild className="w-full mt-6">
                  <Link href={
                    finalContent.type === "podcast_episode" 
                      ? `/content/podcast/${finalContent.id}/edit`
                      : `/content/edit/${finalContent.id}`
                  }>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Conteúdo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita - Detalhes completos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{getDisplayName()}</h1>
                {finalContent.series && finalContent.type === "episode" && (
                  <p className="text-lg text-muted-foreground">
                    {finalContent.series.name} • S{finalContent.season}E{finalContent.episode}
                  </p>
                )}
                {finalContent.podcast && finalContent.type === "podcast_episode" && (
                  <p className="text-lg text-muted-foreground">
                    {finalContent.podcast.name} • Ep {finalContent.episode}
                  </p>
                )}
              </div>
            </div>

            {/* Atores (apenas para filmes/séries) */}
            {finalContent.type !== "podcast_episode" && finalContent.content_actors && finalContent.content_actors.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Elenco</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {finalContent.content_actors.map((contentActor: any) => (
                      <div key={contentActor.id} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {contentActor.actor?.photo_url ? (
                            <Image
                              src={contentActor.actor.photo_url}
                              alt={contentActor.actor.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{contentActor.actor?.name}</p>
                          {contentActor.role_name && (
                            <p className="text-sm text-muted-foreground">{contentActor.role_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Host do Podcast */}
            {finalContent.type === "podcast_episode" && finalContent.podcast?.host && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Host/Apresentador</h3>
                  </div>
                  <p className="text-lg">{finalContent.podcast.host}</p>
                </CardContent>
              </Card>
            )}

            {/* Notas */}
            {finalContent.notes && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Notas</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{finalContent.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Review */}
            {finalContent.review && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Review</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line">{finalContent.review}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadados adicionais */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Informações Adicionais</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">
                      {new Date(finalContent.created_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    <p className="font-medium">
                      {new Date(finalContent.updated_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}