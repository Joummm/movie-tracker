// components/series/MarkEpisodeButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Calendar,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface MarkEpisodeButtonProps {
  episodeId: string;
  seriesId: string;
  episodeNumber: number;
  episodeName: string;
  seasonNumber: number;
}

export function MarkEpisodeButton({
  episodeId,
  seriesId,
  episodeNumber,
  episodeName,
  seasonNumber,
}: MarkEpisodeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [watchDate, setWatchDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [rating, setRating] = useState<string>("");
  const [review, setReview] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [wouldRewatch, setWouldRewatch] = useState<boolean | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const markAsWatched = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        is_watched: true,
        last_rewatch_date: watchDate || new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      };

      if (rating && !isNaN(parseFloat(rating))) {
        updateData.rating = parseFloat(rating);
      }

      if (review) {
        updateData.review = review;
      }

      updateData.would_recommend = wouldRecommend;
      updateData.would_rewatch = wouldRewatch;

      // Atualizar episódio
      const { error: episodeError } = await supabase
        .from("series_episodes")
        .update(updateData)
        .eq("id", episodeId);

      if (episodeError) throw episodeError;

      // Atualizar temporada (watched count)
      const { data: episode } = await supabase
        .from("series_episodes")
        .select("season_id")
        .eq("id", episodeId)
        .single();

      if (episode?.season_id) {
        // Buscar contagem atual
        const { data: seasonEpisodes } = await supabase
          .from("series_episodes")
          .select("id, is_watched")
          .eq("season_id", episode.season_id);

        const watchedCount =
          seasonEpisodes?.filter((ep) => ep.is_watched).length || 0;

        // Atualizar temporada
        await supabase
          .from("series_seasons")
          .update({
            watched_episode_count: watchedCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", episode.season_id);
      }

      toast.success("Episódio marcado como visto!", {
        description: `Episódio ${episodeNumber}: ${episodeName}`,
        duration: 3000,
      });

      setShowDialog(false);
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao marcar episódio:", error);
      toast.error("Erro ao atualizar", {
        description: error.message || "Não foi possível marcar o episódio.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMark = async () => {
    setLoading(true);
    try {
      const updateData = {
        is_watched: true,
        last_rewatch_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("series_episodes")
        .update(updateData)
        .eq("id", episodeId);

      if (error) throw error;

      toast.success("Episódio marcado como visto!", {
        description: `Episódio ${episodeNumber} marcado com data de hoje.`,
        duration: 3000,
      });

      router.refresh();
    } catch (error: any) {
      console.error("Erro ao marcar episódio:", error);
      toast.error("Erro ao atualizar", {
        description: error.message || "Não foi possível marcar o episódio.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setWatchDate(new Date().toISOString().split("T")[0]);
    setRating("");
    setReview("");
    setWouldRecommend(null);
    setWouldRewatch(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
        disabled={loading}
        className="h-8 w-8 p-0 rounded-full hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
        title="Marcar como visto"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Marcar como Visto
                </DialogTitle>
                <DialogDescription className="text-sm">
                  S{seasonNumber}E{episodeNumber}: {episodeName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Data de Visualização */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Data de Visualização
                </Label>
              </div>
              <div className="flex gap-3">
                <Input
                  type="date"
                  value={watchDate}
                  onChange={(e) => setWatchDate(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setWatchDate(new Date().toISOString().split("T")[0])
                  }
                  className="whitespace-nowrap"
                >
                  Hoje
                </Button>
              </div>
            </div>

            {/* Avaliação */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Avaliação (opcional)
                </Label>
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="Nota de 0 a 10"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full"
                />
                <div className="flex gap-2">
                  {[7, 8, 9, 10].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={
                        rating === num.toString() ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setRating(num.toString())}
                      className="flex-1"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Review */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Crítica (opcional)
                </Label>
              </div>
              <Textarea
                placeholder="Escreva sua crítica aqui..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Preferências */}
            <div className="space-y-4">
              {/* Recomendaria? */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Recomendaria este episódio?
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={wouldRecommend === true ? "default" : "outline"}
                    onClick={() => setWouldRecommend(true)}
                    className={`h-9 ${wouldRecommend === true ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRecommend === false ? "default" : "outline"}
                    onClick={() => setWouldRecommend(false)}
                    className={`h-9 ${wouldRecommend === false ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}`}
                  >
                    Não
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRecommend === null ? "secondary" : "outline"}
                    onClick={() => setWouldRecommend(null)}
                    className="h-9"
                  >
                    N/A
                  </Button>
                </div>
              </div>

              {/* Reassistiria? */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Assistiria novamente?
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={wouldRewatch === true ? "default" : "outline"}
                    onClick={() => setWouldRewatch(true)}
                    className={`h-9 ${wouldRewatch === true ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRewatch === false ? "default" : "outline"}
                    onClick={() => setWouldRewatch(false)}
                    className={`h-9 ${wouldRewatch === false ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}`}
                  >
                    Não
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRewatch === null ? "secondary" : "outline"}
                    onClick={() => setWouldRewatch(null)}
                    className="h-9"
                  >
                    N/A
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20 flex-col sm:flex-row gap-3">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
                className="min-w-20"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleQuickMark}
                disabled={loading}
                className="min-w-32"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Marcar Rapidamente
              </Button>
              <Button
                onClick={markAsWatched}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 min-w-32"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
