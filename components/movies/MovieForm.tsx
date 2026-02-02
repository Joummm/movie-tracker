// components/movies/MovieForm.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Film,
  Calendar,
  Plus,
  X,
  Save,
  Trash2,
  Image as ImageIcon,
  Users,
  ExternalLink,
  Quote,
  EyeOff,
  CalendarDays,
  Award,
  Tag,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ptBR } from "date-fns/locale";

// Interfaces
interface CastMember {
  actor_id: string;
  character_name: string;
  is_main_cast: boolean;
}

interface CrewMember {
  person_id: string;
  role: string;
  job_title: string;
}

interface MovieFormProps {
  userId: string;
  genres: any[];
  actors: any[];
  movie?: any;
  existingActors?: any[];
  existingCrew?: any[];
  existingGenres?: any[];
  isEditing?: boolean;
}

// Gêneros principais pré-definidos
const MAIN_GENRES = [
  { id: "action", name: "Ação" },
  { id: "comedy", name: "Comédia" },
  { id: "drama", name: "Drama" },
  { id: "horror", name: "Terror" },
  { id: "scifi", name: "Ficção Científica" },
  { id: "fantasy", name: "Fantasia" },
  { id: "romance", name: "Romance" },
  { id: "thriller", name: "Suspense" },
  { id: "animation", name: "Animação" },
  { id: "documentary", name: "Documentário" },
  { id: "adventure", name: "Aventura" },
  { id: "crime", name: "Crime" },
  { id: "mystery", name: "Mistério" },
  { id: "musical", name: "Musical" },
  { id: "war", name: "Guerra" },
  { id: "western", name: "Faroeste" },
  { id: "biography", name: "Biografia" },
  { id: "history", name: "História" },
];

// Opções de precisão da data
const DATE_PRECISION_OPTIONS = [
  { value: "unknown", label: "Data Desconhecida", icon: EyeOff },
  { value: "year", label: "Apenas Ano", icon: Calendar },
  { value: "month", label: "Ano e Mês", icon: Calendar },
  { value: "day", label: "Data Completa", icon: CalendarDays },
];

// Função para obter ID do gênero pelo nome
const getGenreIdByName = (genreName: string, genresList: any[]) => {
  const existingGenre = genresList.find(
    (g) => g.name.toLowerCase() === genreName.toLowerCase(),
  );

  if (existingGenre) return existingGenre.id;

  const mainGenre = MAIN_GENRES.find(
    (g) => g.name.toLowerCase() === genreName.toLowerCase(),
  );

  return mainGenre?.id;
};

export function MovieForm({
  userId,
  genres,
  actors,
  movie,
  existingActors = [],
  existingCrew = [],
  existingGenres = [],
  isEditing = false,
}: MovieFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Estado principal
  const [loading, setLoading] = useState(false);

  // Estados simplificados
  const [imageUrl, setImageUrl] = useState(movie?.cover_image || "");
  const [imagePreview, setImagePreview] = useState(movie?.cover_image || "");
  const [datePrecision, setDatePrecision] = useState<
    "unknown" | "year" | "month" | "day"
  >(movie?.watched_date ? "day" : "unknown");
  const [watchedDate, setWatchedDate] = useState<Date | undefined>(
    movie?.watched_date ? new Date(movie.watched_date) : undefined,
  );
  const [customGenres, setCustomGenres] = useState<string[]>([]);
  const [newCustomGenre, setNewCustomGenre] = useState("");

  // Estados de formulário
  const [formData, setFormData] = useState(() => ({
    name: movie?.name || "",
    release_year: movie?.release_year || "",
    duration: movie?.duration || "",
    rating: movie?.rating || "",
    watch_status: movie?.watch_status || "planned",
    review: movie?.review || "",
    notes: movie?.notes || "",
    would_recommend: movie?.would_recommend || false,
    would_rewatch: movie?.would_rewatch || false,
  }));

  // Inicializar gêneros selecionados - CORRIGIDO
  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    if (!existingGenres.length) return [];

    return existingGenres
      .map((g: any) => {
        if (g.genre?.name) {
          const genreId = getGenreIdByName(g.genre.name, genres);
          return genreId || g.genre_id;
        }
        return g.genre_id;
      })
      .filter(Boolean);
  });

  const [cast, setCast] = useState<CastMember[]>(
    existingActors.map((actor: any) => ({
      actor_id: actor.actor_id,
      character_name: actor.character_name || "",
      is_main_cast: actor.is_main_cast || false,
    })),
  );

  const [crew, setCrew] = useState<CrewMember[]>(
    existingCrew.map((member: any) => ({
      person_id: member.person_id,
      role: member.role,
      job_title: member.job_title || "",
    })),
  );

  // Estados de busca
  const [searchActor, setSearchActor] = useState<string[]>(() =>
    Array(cast.length || 1).fill(""),
  );
  const [searchCrew, setSearchCrew] = useState<string[]>(() =>
    Array(crew.length || 1).fill(""),
  );

  // Inicializar gêneros customizados
  useEffect(() => {
    if (existingGenres.length > 0) {
      const custom = existingGenres
        .filter((g) => {
          if (!g.genre?.name) return false;
          const isMainGenre = MAIN_GENRES.some(
            (mg) => mg.name.toLowerCase() === g.genre.name.toLowerCase(),
          );
          const isInGenresList = genres.some(
            (genre) => genre.name.toLowerCase() === g.genre.name.toLowerCase(),
          );
          return !isMainGenre && !isInGenresList;
        })
        .map((g) => g.genre?.name || "");

      setCustomGenres(custom);
    }
  }, [existingGenres, genres]);

  // Atualizar preview da imagem
  useEffect(() => {
    if (imageUrl) {
      setImagePreview(imageUrl);
    }
  }, [imageUrl]);

  // Handlers otimizados
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSwitchChange = useCallback((name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  }, []);

  const handleImageUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageUrl(e.target.value);
    },
    [],
  );

  // Cast handlers
  const handleAddCastMember = useCallback(() => {
    setCast((prev) => [
      ...prev,
      { actor_id: "", character_name: "", is_main_cast: false },
    ]);
    setSearchActor((prev) => [...prev, ""]);
  }, []);

  const handleRemoveCastMember = useCallback((index: number) => {
    setCast((prev) => prev.filter((_, i) => i !== index));
    setSearchActor((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCastChange = useCallback(
    (index: number, field: keyof CastMember, value: string | boolean) => {
      setCast((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  // Crew handlers
  const handleAddCrewMember = useCallback(() => {
    setCrew((prev) => [...prev, { person_id: "", role: "", job_title: "" }]);
    setSearchCrew((prev) => [...prev, ""]);
  }, []);

  const handleRemoveCrewMember = useCallback((index: number) => {
    setCrew((prev) => prev.filter((_, i) => i !== index));
    setSearchCrew((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCrewChange = useCallback(
    (index: number, field: keyof CrewMember, value: string) => {
      setCrew((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  // Genre handlers - CORRIGIDO
  const handleAddCustomGenre = useCallback(() => {
    if (
      newCustomGenre.trim() &&
      !customGenres.includes(newCustomGenre.trim())
    ) {
      setCustomGenres((prev) => [...prev, newCustomGenre.trim()]);
      setNewCustomGenre("");
    }
  }, [newCustomGenre, customGenres]);

  const handleRemoveCustomGenre = useCallback((genre: string) => {
    setCustomGenres((prev) => prev.filter((g) => g !== genre));
  }, []);

  // Função para renderizar data formatada
  const renderDateDisplay = useCallback(() => {
    if (datePrecision === "unknown") return "Data Desconhecida";
    if (!watchedDate) return "Selecionar data...";

    switch (datePrecision) {
      case "year":
        return watchedDate.getFullYear().toString();
      case "month":
        return format(watchedDate, "MMM yyyy", { locale: ptBR });
      case "day":
        return format(watchedDate, "dd/MM/yyyy", { locale: ptBR });
    }
  }, [datePrecision, watchedDate]);

  // Opções memoizadas
  const statusOptions = useMemo(
    () => [
      { value: "planned", label: "Planejado" },
      { value: "watching", label: "Assistindo" },
      { value: "completed", label: "Assistido" },
      { value: "abandoned", label: "Abandonado" },
      { value: "rewatching", label: "Reassistindo" },
    ],
    [],
  );

  const roleOptions = useMemo(
    () => [
      { value: "director", label: "Diretor" },
      { value: "producer", label: "Produtor" },
      { value: "writer", label: "Roteirista" },
      { value: "composer", label: "Compositor" },
      { value: "cinematographer", label: "Cinematógrafo" },
      { value: "editor", label: "Editor" },
      { value: "other", label: "Outro" },
    ],
    [],
  );

  // Função para processar gêneros - CORRIGIDA
  const processGenres = async (): Promise<string[]> => {
    const processedIds: string[] = [];

    // Processar gêneros selecionados
    for (const genreIdOrName of [...selectedGenres, ...customGenres]) {
      // Verificar se é um UUID válido
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(genreIdOrName)) {
        processedIds.push(genreIdOrName);
        continue;
      }

      // Buscar gênero existente
      const { data: existingGenre } = await supabase
        .from("genres")
        .select("id")
        .eq("name", genreIdOrName)
        .eq("user_id", userId)
        .single();

      if (existingGenre) {
        processedIds.push(existingGenre.id);
        continue;
      }

      // Criar novo gênero
      const { data: newGenre } = await supabase
        .from("genres")
        .insert({
          name: genreIdOrName,
          user_id: userId,
          is_custom: true,
        })
        .select()
        .single();

      if (newGenre) {
        processedIds.push(newGenre.id);
      }
    }

    return processedIds.filter(Boolean);
  };

  // Função principal de submit - CORRIGIDA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare movie data
      const movieData: any = {
        user_id: userId,
        type: "movie",
        name: formData.name,
        watch_status: formData.watch_status,
        would_recommend: formData.would_recommend,
        would_rewatch: formData.would_rewatch,
        review: formData.review || null,
        notes: formData.notes || null,
      };

      // Adicionar imagem
      if (imageUrl.trim()) {
        movieData.cover_image = imageUrl;
      }

      // Campos numéricos
      if (formData.release_year) {
        const year = parseInt(formData.release_year);
        if (!isNaN(year)) movieData.release_year = year;
      }

      if (formData.duration) {
        const duration = parseInt(formData.duration);
        if (!isNaN(duration)) movieData.duration = duration;
      }

      if (formData.rating) {
        const rating = parseFloat(formData.rating);
        if (!isNaN(rating)) movieData.rating = rating;
      }

      // Data assistida
      if (datePrecision !== "unknown" && watchedDate) {
        let dateString = "";
        switch (datePrecision) {
          case "year":
            dateString = watchedDate.getFullYear().toString();
            break;
          case "month":
            dateString = format(watchedDate, "yyyy-MM");
            break;
          case "day":
            dateString = format(watchedDate, "yyyy-MM-dd");
            break;
        }
        movieData.watched_date = dateString;
      }

      let movieId = movie?.id;

      if (isEditing) {
        // Update existing movie
        const { error } = await supabase
          .from("content")
          .update(movieData)
          .eq("id", movieId)
          .eq("user_id", userId);

        if (error) throw error;

        // Delete existing relationships
        await Promise.all([
          supabase.from("content_actors").delete().eq("content_id", movieId),
          supabase.from("content_crew").delete().eq("content_id", movieId),
          supabase.from("content_genres").delete().eq("content_id", movieId),
        ]);
      } else {
        // Create new movie
        const { data, error } = await supabase
          .from("content")
          .insert([movieData])
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error("Nenhum dado retornado");

        movieId = data.id;
      }

      // Processar e salvar gêneros - CORRIGIDO
      const genreIds = await processGenres();
      if (genreIds.length > 0) {
        const genrePromises = genreIds.map((genreId) =>
          supabase.from("content_genres").insert({
            content_id: movieId,
            genre_id: genreId,
          }),
        );
        await Promise.all(genrePromises);
      }

      // Add cast
      const validCast = cast.filter((c) => c.actor_id);
      if (validCast.length > 0) {
        const castPromises = validCast.map((castMember, index) =>
          supabase.from("content_actors").insert({
            content_id: movieId,
            actor_id: castMember.actor_id,
            character_name: castMember.character_name,
            is_main_cast: castMember.is_main_cast,
            credit_order: index,
          }),
        );
        await Promise.all(castPromises);
      }

      // Add crew
      const validCrew = crew.filter((c) => c.person_id && c.role);
      if (validCrew.length > 0) {
        const crewPromises = validCrew.map((crewMember) =>
          supabase.from("content_crew").insert({
            content_id: movieId,
            person_id: crewMember.person_id,
            role: crewMember.role,
            job_title: crewMember.job_title,
          }),
        );
        await Promise.all(crewPromises);
      }

      toast.success(isEditing ? "Filme atualizado!" : "Filme adicionado!");
      router.push(`/movies/${movieId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao salvar filme");
    } finally {
      setLoading(false);
    }
  };

  // Componente para seção de data
  const DateSection = () => (
    <div className="space-y-3">
      <Label>Quando Assistiu</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Precisão da Data</Label>
          <div className="grid grid-cols-2 gap-2">
            {DATE_PRECISION_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDatePrecision(option.value as any);
                    if (option.value === "unknown") {
                      setWatchedDate(undefined);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                    datePrecision === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {datePrecision !== "unknown" && (
          <div className="space-y-2">
            <Label className="text-sm">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {renderDateDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={watchedDate}
                  onSelect={setWatchedDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );

  // Componente para seção de imagem
  const ImageSection = () => (
    <div className="space-y-4">
      <Label>Imagem de Capa (URL)</Label>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div className="relative aspect-2/3 rounded-lg overflow-hidden border">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => setImagePreview("")}
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-muted">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-center text-muted-foreground">
                    Nenhuma imagem
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:w-2/3 space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://exemplo.com/imagem.jpg"
            />
            <p className="text-sm text-muted-foreground">
              Cole a URL de uma imagem da internet
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Sugestões de fontes:</Label>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  name: "TMDB",
                  url: "https://www.themoviedb.org/",
                  color: "bg-blue-500",
                },
                {
                  name: "IMDb",
                  url: "https://www.imdb.com/",
                  color: "bg-yellow-500",
                },
                {
                  name: "Film-Grab",
                  url: "https://film-grab.com/",
                  color: "bg-purple-500",
                },
                {
                  name: "Letterboxd",
                  url: "https://letterboxd.com/",
                  color: "bg-green-500",
                },
              ].map((site) => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${site.color} text-white text-xs font-medium hover:opacity-90`}
                >
                  {site.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para seção de gêneros - CORRIGIDO
  const GenresSection = () => {
    // Filtrar gêneros únicos (da base de dados e principais)
    const allAvailableGenres = useMemo(() => {
      const genreMap = new Map();

      // Adicionar gêneros da base de dados
      genres.forEach((genre) => {
        genreMap.set(genre.name.toLowerCase(), {
          id: genre.id,
          name: genre.name,
          source: "db",
        });
      });

      // Adicionar gêneros principais (apenas se não existirem)
      MAIN_GENRES.forEach((genre) => {
        const key = genre.name.toLowerCase();
        if (!genreMap.has(key)) {
          genreMap.set(key, {
            id: genre.id,
            name: genre.name,
            source: "main",
          });
        }
      });

      return Array.from(genreMap.values());
    }, [genres]);

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Gêneros Principais</Label>
          <div className="flex flex-wrap gap-2">
            {allAvailableGenres.map((genre) => (
              <Badge
                key={genre.id}
                variant={
                  selectedGenres.includes(genre.id) ? "default" : "outline"
                }
                className="cursor-pointer gap-2"
                onClick={() => {
                  setSelectedGenres((prev) =>
                    prev.includes(genre.id)
                      ? prev.filter((id) => id !== genre.id)
                      : [...prev, genre.id],
                  );
                }}
              >
                <Tag className="h-3 w-3" />
                {genre.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Gêneros Personalizados</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newCustomGenre}
                onChange={(e) => setNewCustomGenre(e.target.value)}
                placeholder="Adicionar gênero personalizado..."
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), handleAddCustomGenre())
                }
              />
              <Button
                type="button"
                onClick={handleAddCustomGenre}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {customGenres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customGenres.map((genre, index) => (
                  <Badge key={index} variant="secondary" className="gap-2">
                    {genre}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomGenre(genre)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção 1: Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Film className="h-6 w-6" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Informações essenciais sobre o filme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="name">Nome do Filme *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: O Poderoso Chefão"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="release_year">Ano de Lançamento</Label>
              <Input
                id="release_year"
                name="release_year"
                type="number"
                min="1888"
                max="2100"
                value={formData.release_year}
                onChange={handleInputChange}
                placeholder="Ex: 1972"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Ex: 175"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="rating">Sua Avaliação (0-10)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.rating}
                onChange={handleInputChange}
                placeholder="Ex: 9.2"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="watch_status">Status</Label>
            <Select
              value={formData.watch_status}
              onValueChange={(value) =>
                handleSelectChange("watch_status", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateSection />
          <ImageSection />
          <GenresSection />
        </CardContent>
      </Card>

      {/* Seção 2: Elenco */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            Elenco
            <Badge variant="outline">
              {cast.filter((c) => c.actor_id).length} membros
            </Badge>
          </CardTitle>
          <CardDescription>
            Adicione os atores e seus personagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cast.map((castMember, index) => {
            const actor = actors.find((a) => a.id === castMember.actor_id);
            return (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ator</Label>
                    <Select
                      value={castMember.actor_id}
                      onValueChange={(value) =>
                        handleCastChange(index, "actor_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ator" />
                      </SelectTrigger>
                      <SelectContent>
                        <Command>
                          <CommandInput placeholder="Pesquisar ator..." />
                          <CommandList>
                            <CommandEmpty>Nenhum ator encontrado</CommandEmpty>
                            <CommandGroup>
                              {actors.map((actor) => (
                                <CommandItem
                                  key={actor.id}
                                  value={actor.id}
                                  onSelect={() =>
                                    handleCastChange(
                                      index,
                                      "actor_id",
                                      actor.id,
                                    )
                                  }
                                >
                                  {actor.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Personagem</Label>
                    <Input
                      value={castMember.character_name}
                      onChange={(e) =>
                        handleCastChange(
                          index,
                          "character_name",
                          e.target.value,
                        )
                      }
                      placeholder="Nome do personagem"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={castMember.is_main_cast}
                        onCheckedChange={(checked) =>
                          handleCastChange(index, "is_main_cast", checked)
                        }
                        id={`main-cast-${index}`}
                      />
                      <Label htmlFor={`main-cast-${index}`}>Principal</Label>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCastMember(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {actor && (
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{actor.name}</span>
                      {actor.birth_date && (
                        <span className="text-xs">
                          Nascimento: {new Date(actor.birth_date).getFullYear()}
                        </span>
                      )}
                    </div>
                    {actor.biography && (
                      <p className="mt-1 text-xs line-clamp-2">
                        {actor.biography}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddCastMember}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Ator
          </Button>
        </CardContent>
      </Card>

      {/* Seção 3: Equipe Técnica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Award className="h-6 w-6" />
            Equipe Técnica
            <Badge variant="outline">
              {crew.filter((c) => c.person_id).length} membros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {crew.map((crewMember, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Pessoa</Label>
                  <Select
                    value={crewMember.person_id}
                    onValueChange={(value) =>
                      handleCrewChange(index, "person_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pessoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <Command>
                        <CommandInput placeholder="Pesquisar pessoa..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma pessoa encontrada</CommandEmpty>
                          <CommandGroup>
                            {actors.map((person) => (
                              <CommandItem
                                key={person.id}
                                value={person.id}
                                onSelect={() =>
                                  handleCrewChange(
                                    index,
                                    "person_id",
                                    person.id,
                                  )
                                }
                              >
                                {person.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select
                    value={crewMember.role}
                    onValueChange={(value) =>
                      handleCrewChange(index, "role", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={crewMember.job_title}
                    onChange={(e) =>
                      handleCrewChange(index, "job_title", e.target.value)
                    }
                    placeholder="Ex: Diretor de Fotografia"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCrewMember(index)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddCrewMember}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Membro da Equipe
          </Button>
        </CardContent>
      </Card>

      {/* Seção 4: Anotações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Quote className="h-6 w-6" />
            Anotações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="review">Sua Resenha</Label>
            <Textarea
              id="review"
              name="review"
              value={formData.review}
              onChange={handleInputChange}
              placeholder="Escreva sua resenha sobre o filme..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes">Notas Pessoais</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Outras anotações sobre o filme..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Switch
                checked={formData.would_recommend}
                onCheckedChange={(checked) =>
                  handleSwitchChange("would_recommend", checked)
                }
                id="would_recommend"
              />
              <div className="space-y-1">
                <Label htmlFor="would_recommend" className="font-medium">
                  Recomendaria este filme
                </Label>
                <p className="text-sm text-muted-foreground">
                  Marcar se indicaria para outras pessoas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Switch
                checked={formData.would_rewatch}
                onCheckedChange={(checked) =>
                  handleSwitchChange("would_rewatch", checked)
                }
                id="would_rewatch"
              />
              <div className="space-y-1">
                <Label htmlFor="would_rewatch" className="font-medium">
                  Reassistiria este filme
                </Label>
                <p className="text-sm text-muted-foreground">
                  Marcar se assistiria novamente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 5: Ações */}
      <div className="flex items-center justify-between gap-4 p-6 border rounded-xl">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>

        <div className="flex items-center gap-4">
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={async () => {
                if (confirm("Tem certeza que deseja excluir este filme?")) {
                  try {
                    setLoading(true);
                    const { error } = await supabase
                      .from("content")
                      .delete()
                      .eq("id", movie.id)
                      .eq("user_id", userId);

                    if (error) throw error;

                    toast.success("Filme excluído com sucesso!");
                    router.push("/movies");
                    router.refresh();
                  } catch (error: any) {
                    toast.error(error.message || "Erro ao excluir filme");
                  } finally {
                    setLoading(false);
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}

          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Salvando...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? "Atualizar Filme" : "Adicionar Filme"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
