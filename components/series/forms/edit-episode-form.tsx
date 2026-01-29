// components/series/forms/edit-episode-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  Star,
  Eye,
  FileText,
  Save,
  X,
  AlertTriangle,
  ThumbsUp,
  RefreshCw,
  Tv,
  Hash
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditEpisodeFormProps {
  episode: any;
  seriesId: string;
  seasonId: string;
  userId: string;
}

export function EditEpisodeForm({ episode, seriesId, seasonId, userId }: EditEpisodeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: episode.name || "",
    episode_number: episode.episode_number || 1,
    duration: episode.duration || 45,
    release_date: episode.release_date || "",
    is_watched: episode.is_watched || false,
    rating: episode.rating || 0,
    review: episode.review || "",
    notes: episode.notes || "",
    would_recommend: episode.would_recommend || false,
    would_rewatch: episode.would_rewatch || false,
    rewatch_count: episode.rewatch_count || 0,
    last_rewatch_date: episode.last_rewatch_date || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const episodeData = {
        name: formData.name || null,
        episode_number: formData.episode_number,
        duration: formData.duration || null,
        release_date: formData.release_date || null,
        is_watched: formData.is_watched,
        rating: formData.rating > 0 ? formData.rating : null,
        review: formData.review || null,
        notes: formData.notes || null,
        would_recommend: formData.would_recommend || null,
        would_rewatch: formData.would_rewatch || null,
        rewatch_count: formData.rewatch_count || 0,
        last_rewatch_date: formData.last_rewatch_date || null,
        updated_at: new Date().toISOString(),
      };

      // Tente atualizar na tabela series_episodes
      const { error: tableError } = await supabase
        .from("series_episodes")
        .update(episodeData)
        .eq("id", episode.id)
        .eq("user_id", userId);

      if (tableError) {
        // Se falhar, tente na tabela content
        const { error: contentError } = await supabase
          .from("content")
          .update({
            name: formData.name || null,
            episode: formData.episode_number,
            duration: formData.duration || null,
            watched_date: formData.release_date || null,
            watch_status: formData.is_watched ? 'completed' : 'planned',
            rating: formData.rating > 0 ? formData.rating : null,
            review: formData.review || null,
            would_recommend: formData.would_recommend || null,
            would_rewatch: formData.would_rewatch || null,
            rewatch_count: formData.rewatch_count || 0,
            last_rewatch_date: formData.last_rewatch_date || null,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", episode.id)
          .eq("user_id", userId);

        if (contentError) throw contentError;
      }

      alert("Episódio atualizado com sucesso!");
      router.push(`/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}`);
      router.refresh();
      
    } catch (error: any) {
      console.error("Erro ao atualizar episódio:", error);
      alert(`Erro ao atualizar episódio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      // Tente excluir da tabela series_episodes
      const { error: tableError } = await supabase
        .from("series_episodes")
        .delete()
        .eq("id", episode.id)
        .eq("user_id", userId);

      if (tableError) {
        // Se falhar, tente na tabela content
        const { error: contentError } = await supabase
          .from("content")
          .delete()
          .eq("id", episode.id)
          .eq("user_id", userId);

        if (contentError) throw contentError;
      }

      alert("Episódio excluído com sucesso!");
      router.push(`/series/${seriesId}/seasons/${seasonId}`);
      router.refresh();
      
    } catch (error: any) {
      console.error("Erro ao excluir episódio:", error);
      alert(`Erro ao excluir episódio: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Tv className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="rating" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Avaliação
                </TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Informações essenciais sobre o episódio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="episode_number" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Número do Episódio
                        </Label>
                        <Input
                          id="episode_number"
                          name="episode_number"
                          type="number"
                          min="0"
                          value={formData.episode_number}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <Tv className="h-4 w-4" />
                          Nome do Episódio
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nome do episódio"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Duração (minutos)
                        </Label>
                        <Input
                          id="duration"
                          name="duration"
                          type="number"
                          min="0"
                          value={formData.duration}
                          onChange={handleInputChange}
                          placeholder="45"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="release_date" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Data de Lançamento
                        </Label>
                        <Input
                          id="release_date"
                          name="release_date"
                          type="date"
                          value={formData.release_date}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="is_watched" className="cursor-pointer flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Assistido
                        </Label>
                        <Switch
                          id="is_watched"
                          checked={formData.is_watched}
                          onCheckedChange={(checked) => handleSwitchChange("is_watched", checked)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes Adicionais</CardTitle>
                    <CardDescription>
                      Informações adicionais sobre o episódio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas Pessoais</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Adicione notas pessoais sobre este episódio..."
                        rows={6}
                        disabled={isLoading}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="would_recommend" className="cursor-pointer flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          Recomendaria
                        </Label>
                        <Switch
                          id="would_recommend"
                          checked={formData.would_recommend}
                          onCheckedChange={(checked) => handleSwitchChange("would_recommend", checked)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="would_rewatch" className="cursor-pointer flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Assistiria Novamente
                        </Label>
                        <Switch
                          id="would_rewatch"
                          checked={formData.would_rewatch}
                          onCheckedChange={(checked) => handleSwitchChange("would_rewatch", checked)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rewatch_count">Vezes Reassistido</Label>
                        <Input
                          id="rewatch_count"
                          name="rewatch_count"
                          type="number"
                          min="0"
                          value={formData.rewatch_count}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_rewatch_date">Última Revisão</Label>
                        <Input
                          id="last_rewatch_date"
                          name="last_rewatch_date"
                          type="date"
                          value={formData.last_rewatch_date}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rating Tab */}
              <TabsContent value="rating" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliação</CardTitle>
                    <CardDescription>
                      Avalie e comente sobre o episódio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        Avaliação (0-10)
                      </Label>
                      <div className="relative">
                        <Input
                          id="rating"
                          name="rating"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={formData.rating}
                          onChange={handleInputChange}
                          placeholder="9.5"
                          disabled={isLoading}
                          className="pl-10"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Star className="h-4 w-4 text-yellow-500" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Deixe 0 para não avaliar
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review">Crítica / Comentários</Label>
                      <Textarea
                        id="review"
                        name="review"
                        value={formData.review}
                        onChange={handleInputChange}
                        placeholder="Escreva sua crítica ou comentários sobre este episódio..."
                        rows={8}
                        disabled={isLoading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões no rodapé (mobile) */}
            <div className="flex lg:hidden flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Como seu episódio aparecerá
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-300">Episódio #{formData.episode_number}</p>
                      <h3 className="font-semibold text-lg">
                        {formData.name || `Episódio ${formData.episode_number}`}
                      </h3>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      formData.is_watched ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {formData.is_watched ? 'Assistido' : 'Não Assistido'}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{formData.duration} minutos</span>
                    </div>
                    
                    {formData.release_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(formData.release_date).toLocaleDateString('pt-PT')}</span>
                      </div>
                    )}
                    
                    {formData.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span>{formData.rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="hidden lg:block space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base gap-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Salvando...
                        </div>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Zona de Perigo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-red-600">
                    Esta ação não pode ser desfeita. O episódio será permanentemente removido.
                  </p>
                  
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        disabled={isLoading}
                      >
                        Excluir Episódio
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Episódio</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o episódio "{episode.name || `Episódio ${episode.episode_number}`}"?
                          <br />
                          <span className="font-semibold text-red-600">
                            Esta ação não pode ser desfeita.
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isLoading ? "Excluindo..." : "Excluir Permanentemente"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>

      {/* Danger Zone Mobile */}
      <div className="lg:hidden mt-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-600">
              Esta ação não pode ser desfeita. O episódio será permanentemente removido.
            </p>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={isLoading}
                >
                  Excluir Episódio
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Episódio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o episódio "{episode.name || `Episódio ${episode.episode_number}`}"?
                    <br />
                    <span className="font-semibold text-red-600">
                      Esta ação não pode ser desfeita.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? "Excluindo..." : "Excluir Permanentemente"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}