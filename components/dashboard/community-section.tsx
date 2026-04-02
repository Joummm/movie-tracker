"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CopyPlus, Search, User, Loader2, Film, Tv, Clapperboard, Mic, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface UserData {
  movies: any[];
  episodes: any[];
  shorts: any[];
  others: any[];
  series: any[];
  podcasts: any[];
  podcastEpisodes: any[];
}

type ContentTab = "movies" | "series" | "shorts" | "podcasts" | "others";

const TABS: { key: ContentTab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "movies", label: "Filmes", icon: <Film className="h-4 w-4" />, color: "text-emerald-500" },
  { key: "series", label: "Séries", icon: <Tv className="h-4 w-4" />, color: "text-blue-500" },
  { key: "shorts", label: "Curtas", icon: <Clapperboard className="h-4 w-4" />, color: "text-orange-500" },
  { key: "podcasts", label: "Podcasts", icon: <Mic className="h-4 w-4" />, color: "text-purple-500" },
  { key: "others", label: "Outros", icon: <Zap className="h-4 w-4" />, color: "text-amber-500" },
];

export function CommunitySection({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeContentTab, setActiveContentTab] = useState<ContentTab>("movies");
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    async function loadProfiles() {
      try {
        const res = await fetch("/api/community/profiles");
        const data = await res.json();
        if (!res.ok) {
          toast.error("Erro ao buscar utilizadores: " + (data.error || "Erro desconhecido"));
          return;
        }
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error("Erro ao buscar perfis:", err);
        toast.error("Erro de rede ao buscar utilizadores.");
      } finally {
        setLoading(false);
      }
    }
    loadProfiles();
  }, []);

  const loadUserContent = async (profile: ProfileData) => {
    setSelectedProfile(profile);
    setUserData(null);
    setContentLoading(true);
    setActiveContentTab("movies");

    try {
      const res = await fetch(`/api/community/content?userId=${profile.id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error("Erro ao buscar conteúdo: " + (data.error || "Erro desconhecido"));
        return;
      }
      setUserData(data);
    } catch (err) {
      console.error("Erro ao buscar conteúdo:", err);
      toast.error("Erro de rede ao buscar conteúdo.");
    } finally {
      setContentLoading(false);
    }
  };

  const getTabCount = (tab: ContentTab): number => {
    if (!userData) return 0;
    switch (tab) {
      case "movies": return userData.movies.length;
      case "series": return userData.series.length;
      case "shorts": return userData.shorts.length;
      case "podcasts": return userData.podcasts.length;
      case "others": return userData.others.length;
    }
  };

  const getActiveItems = (): any[] => {
    if (!userData) return [];
    switch (activeContentTab) {
      case "movies": return userData.movies;
      case "series": return userData.series;
      case "shorts": return userData.shorts;
      case "podcasts": return userData.podcasts;
      case "others": return userData.others;
    }
  };

  const getTotalCount = (): number => {
    if (!userData) return 0;
    return userData.movies.length + userData.series.length +
      userData.shorts.length + userData.podcasts.length + userData.others.length;
  };

  // Copy a movie/short/other content item
  const copyContentToMyAccount = async (item: any) => {
    setAddingIds((prev) => new Set(prev).add(item.id));
    const newContent = {
      user_id: currentUserId,
      type: item.type,
      name: item.name,
      cover_image: item.cover_image,
      duration: item.duration,
      release_year: item.release_year,
      rating: null,
      notes: null,
      review: null,
      watched_date: null,
      watched_year: null,
      watched_month: null,
      watched_day: null,
      date_unknown: true,
    };
    const { error } = await supabase.from("content").insert(newContent);
    if (error) {
      toast.error("Erro ao adicionar conteúdo.");
      console.error(error);
    } else {
      toast.success(`"${item.name || "Conteúdo"}" adicionado!`);
    }
    setAddingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
  };

  // Copy a series (including seasons and episodes)
  const copySeriesToMyAccount = async (item: any) => {
    setAddingIds((prev) => new Set(prev).add(item.id));
    
    try {
      const res = await fetch("/api/community/copy-series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetSeriesId: item.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Erro ao adicionar série: " + (data.error || "Erro desconhecido"));
        console.error(data.error);
      } else {
        toast.success(`"${item.name || "Série"}" e seus episódios foram adicionados!`);
      }
    } catch (error) {
      toast.error("Erro de rede ao adicionar série.");
      console.error(error);
    } finally {
      setAddingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    }
  };

  // Copy a podcast 
  const copyPodcastToMyAccount = async (item: any) => {
    setAddingIds((prev) => new Set(prev).add(item.id));
    const newPodcast = {
      user_id: currentUserId,
      name: item.name,
      cover_image: item.cover_image,
      release_year: item.release_year,
      status: "in_progress",
      description: item.description,
      host: item.host,
    };
    const { error } = await supabase.from("podcasts").insert(newPodcast);
    if (error) {
      toast.error("Erro ao adicionar podcast.");
      console.error(error);
    } else {
      toast.success(`"${item.name || "Podcast"}" adicionado!`);
    }
    setAddingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
  };

  const handleAdd = (item: any) => {
    switch (activeContentTab) {
      case "movies":
      case "shorts":
      case "others":
        return copyContentToMyAccount(item);
      case "series":
        return copySeriesToMyAccount(item);
      case "podcasts":
        return copyPodcastToMyAccount(item);
    }
  };

  const filteredProfiles = profiles.filter((p) =>
    p.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeItems = getActiveItems();

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      {/* Sidebar Users */}
      <Card className="flex flex-col" style={{ minHeight: "650px" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Comunidade</CardTitle>
          <CardDescription>Veja o que os outros acompanham</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Procurar utilizador..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando...
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum utilizador encontrado.
              </div>
            ) : (
              <div className="flex flex-col gap-1 pb-4">
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedProfile?.id === profile.id
                        ? "bg-primary/10 ring-1 ring-primary/20"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => loadUserContent(profile)}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {profile.display_name?.substring(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-sm truncate">{profile.display_name}</span>
                      {profile.id === currentUserId && (
                        <span className="text-[10px] text-muted-foreground">(Você)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="flex flex-col gap-4">
        {/* Profile Header */}
        {selectedProfile && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedProfile.avatar_url || ""} />
                  <AvatarFallback>
                    {selectedProfile.display_name?.substring(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedProfile.display_name}</CardTitle>
                  <CardDescription>
                    {contentLoading
                      ? "A carregar..."
                      : `${getTotalCount()} itens no total`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Content Tabs + List */}
        <Card className="flex-1 flex flex-col" style={{ minHeight: "560px" }}>
          {!selectedProfile ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecione um perfil para explorar a sua biblioteca.</p>
              </div>
            </div>
          ) : contentLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              A carregar conteúdos...
            </div>
          ) : (
            <>
              {/* Type Tabs */}
              <div className="border-b px-4 pt-3">
                <div className="flex gap-1 overflow-x-auto pb-0">
                  {TABS.map((tab) => {
                    const count = getTabCount(tab.key);
                    const isActive = activeContentTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveContentTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                          isActive
                            ? `${tab.color} border-current bg-muted/50`
                            : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive ? "bg-foreground/10" : "bg-muted"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items Grid */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {activeItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-sm">Nenhum item nesta categoria.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 pb-4">
                      {activeItems.map((item) => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          tab={activeContentTab}
                          isAdding={addingIds.has(item.id)}
                          onAdd={() => handleAdd(item)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ========== Content Card Component ==========

function ContentCard({
  item,
  tab,
  isAdding,
  onAdd,
}: {
  item: any;
  tab: ContentTab;
  isAdding: boolean;
  onAdd: () => void;
}) {
  const name = item.name || item.series?.name || item.podcasts?.name || "Sem Nome";
  const image = item.cover_image || item.poster_vertical || null;
  const year = item.release_year;

  // Build subtitle based on type
  let subtitle = "";
  if (tab === "series") {
    const s = item.total_seasons || 0;
    const e = item.total_episodes || 0;
    subtitle = `${s} temporada${s !== 1 ? "s" : ""} · ${e} episódio${e !== 1 ? "s" : ""}`;
    if (item.status) {
      const statusMap: Record<string, string> = {
        in_progress: "Em progresso",
        completed: "Completa",
        abandoned: "Abandonada",
        planned: "Planeada",
      };
      subtitle += ` · ${statusMap[item.status] || item.status}`;
    }
  } else if (tab === "podcasts") {
    if (item.host) subtitle = `Host: ${item.host}`;
    if (item.status) {
      const statusMap: Record<string, string> = {
        in_progress: "Em progresso",
        completed: "Completo",
        abandoned: "Abandonado",
      };
      subtitle += subtitle ? ` · ${statusMap[item.status] || item.status}` : statusMap[item.status] || item.status;
    }
  } else {
    if (item.duration) subtitle = `${item.duration} min`;
    if (item.series?.name) subtitle += (subtitle ? " · " : "") + item.series.name;
  }

  // Add button label
  const addLabel: Record<ContentTab, string> = {
    movies: "Adicionar filme",
    series: "Adicionar série",
    shorts: "Adicionar curta",
    podcasts: "Adicionar podcast",
    others: "Adicionar",
  };

  return (
    <div className="flex gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors items-start">
      {/* Cover image */}
      <div className="w-14 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
            {tab === "movies" && <Film className="h-5 w-5" />}
            {tab === "series" && <Tv className="h-5 w-5" />}
            {tab === "shorts" && <Clapperboard className="h-5 w-5" />}
            {tab === "podcasts" && <Mic className="h-5 w-5" />}
            {tab === "others" && <Zap className="h-5 w-5" />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h4 className="font-semibold text-sm truncate" title={name}>
          {name}
        </h4>
        <div className="flex flex-wrap gap-1">
          {year && (
            <Badge variant="secondary" className="text-[10px]">
              {year}
            </Badge>
          )}
          {item.rating && (
            <Badge variant="secondary" className="text-[10px]">
              ⭐ {item.rating}/10
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
        <div className="mt-auto pt-2">
          <Button
            size="sm"
            variant="secondary"
            className="w-full text-xs h-7"
            disabled={isAdding}
            onClick={onAdd}
          >
            {isAdding ? (
              <Loader2 size={12} className="mr-1.5 animate-spin" />
            ) : (
              <CopyPlus size={12} className="mr-1.5" />
            )}
            {isAdding ? "A adicionar..." : addLabel[tab]}
          </Button>
        </div>
      </div>
    </div>
  );
}
