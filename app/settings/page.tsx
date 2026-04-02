"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ExportData {
  version: string;
  exportedAt: string;
  tables: Record<string, any[]>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUserId(user.id);
    setIsLoading(false);
  }

  async function handleExport() {
    setIsExporting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const exportData: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        tables: {}
      };

      // Tables that can be filtered directly by user_id
      const tablesWithUserId = [
        "profiles", "actors", "collections", "content", "genres", 
        "content_lists", "podcast_episodes", "podcasts", "series", 
        "series_seasons", "user_goals", "user_statistics", "watch_sessions"
      ];

      for (const table of tablesWithUserId) {
        if (table === "profiles") {
          const { data } = await supabase.from(table).select("*").eq("id", userId);
          if (data) exportData.tables[table] = data;
        } else {
          const { data } = await supabase.from(table).select("*").eq("user_id", userId);
          if (data) exportData.tables[table] = data;
        }
      }

      // Tables depending on parent relationships for filtering
      // Using in-memory filtering since it relies on related tables
      
      const { data: listItems } = await supabase.from("list_items").select("*");
      if (listItems && exportData.tables["content_lists"]) {
        const listIds = exportData.tables["content_lists"].map((l: any) => l.id);
        exportData.tables["list_items"] = listItems.filter((item: any) => listIds.includes(item.list_id));
      }

      const { data: collectionItems } = await supabase.from("collection_items").select("*");
      if (collectionItems && exportData.tables["collections"]) {
        const colIds = exportData.tables["collections"].map((c: any) => c.id);
        exportData.tables["collection_items"] = collectionItems.filter((item: any) => colIds.includes(item.collection_id));
      }
      
      const { data: contentActors } = await supabase.from("content_actors").select("*");
      if (contentActors && exportData.tables["content"]) {
        const contentIds = exportData.tables["content"].map((c: any) => c.id);
        exportData.tables["content_actors"] = contentActors.filter((item: any) => contentIds.includes(item.content_id));
      }

      const { data: contentCrew } = await supabase.from("content_crew").select("*");
      if (contentCrew && exportData.tables["content"]) {
        const contentIds = exportData.tables["content"].map((c: any) => c.id);
        exportData.tables["content_crew"] = contentCrew.filter((item: any) => contentIds.includes(item.content_id));
      }

      const { data: contentGenres } = await supabase.from("content_genres").select("*");
      if (contentGenres && exportData.tables["content"]) {
        const contentIds = exportData.tables["content"].map((c: any) => c.id);
        exportData.tables["content_genres"] = contentGenres.filter((item: any) => contentIds.includes(item.content_id));
      }

      const { data: contentViewings } = await supabase.from("content_viewings").select("*");
      if (contentViewings && exportData.tables["content"]) {
        const contentIds = exportData.tables["content"].map((c: any) => c.id);
        exportData.tables["content_viewings"] = contentViewings.filter((item: any) => contentIds.includes(item.content_id));
      }

      const { data: podcastHosts } = await supabase.from("podcast_hosts").select("*");
      if (podcastHosts && exportData.tables["podcasts"]) {
        const podcastIds = exportData.tables["podcasts"].map((p: any) => p.id);
        exportData.tables["podcast_hosts"] = podcastHosts.filter((item: any) => podcastIds.includes(item.podcast_id));
      }

      const { data: seriesCast } = await supabase.from("series_cast").select("*");
      if (seriesCast && exportData.tables["series"]) {
        const seriesIds = exportData.tables["series"].map((s: any) => s.id);
        exportData.tables["series_cast"] = seriesCast.filter((item: any) => seriesIds.includes(item.series_id));
      }
      
      const { data: seriesEpStr } = await supabase.from("series_episode_structure").select("*");
      if (seriesEpStr && exportData.tables["series"]) {
        const seriesIds = exportData.tables["series"].map((s: any) => s.id);
        exportData.tables["series_episode_structure"] = seriesEpStr.filter((item: any) => seriesIds.includes(item.series_id));
      }

      const { data: seriesEpisodes } = await supabase.from("series_episodes").select("*");
      if (seriesEpisodes && exportData.tables["series"]) {
        const seriesIds = exportData.tables["series"].map((s: any) => s.id);
        exportData.tables["series_episodes"] = seriesEpisodes.filter((item: any) => seriesIds.includes(item.series_id));
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `media-tracker-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Todos os dados exportados com sucesso!" });
    } catch (error) {
      console.error("Export error:", error);
      setMessage({
        type: "error",
        text: "Erro ao exportar dados. Tente novamente.",
      });
    }

    setIsExporting(false);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const rawData = JSON.parse(text);

      let tablesToImport: Record<string, any[]> = {};

      if (rawData.version === "2.0" && rawData.tables) {
        tablesToImport = rawData.tables;
      } else {
        // Fallback para versão 1.0
        tablesToImport = {
          profiles: rawData.profile ? [rawData.profile] : [],
          series: rawData.series || [],
          content: rawData.content || [],
          content_lists: rawData.lists || [],
          list_items: rawData.listItems || []
        };
      }

      const supabase = createClient();

      // Ordem hierárquica de inserção (pais antes de filhos) para respeitar foreign keys
      const tablesOrder = [
        // Level 0 (sem depedências a não ser Auth User)
        "actors", "genres", "series", "podcasts", "collections", "content_lists", "watch_sessions", "user_goals", "user_statistics",
        // Level 1
        "series_seasons", "podcast_episodes", "podcast_hosts", "series_cast", "series_episode_structure", 
        // Level 2
        "content",
        // Level 3
        "series_episodes",
        // Level 4
        "content_actors", "content_crew", "content_genres", "list_items", "collection_items", "content_viewings"
      ];

      for (const table of tablesOrder) {
        const rows = tablesToImport[table];
        if (!rows || rows.length === 0) continue;

        const preparedRows = rows.map((row: any) => {
          const newRow = { ...row };
          if ('user_id' in newRow) {
            newRow.user_id = userId;
          }
          return newRow;
        });

        const chunkSize = 100;
        for (let i = 0; i < preparedRows.length; i += chunkSize) {
          const chunk = preparedRows.slice(i, i + chunkSize);
          const { error } = await supabase.from(table).upsert(chunk);
          if (error) {
             console.error(`Error importing table ${table}:`, error);
          }
        }
      }

      // Se viermos o profile, atualiza separadamente (id ao invés de user_id)
      if (tablesToImport.profiles && tablesToImport.profiles.length > 0) {
        const p = tablesToImport.profiles[0];
        await supabase.from("profiles").upsert({
          id: userId,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          bio: p.bio,
          theme_preference: p.theme_preference,
          preferences: p.preferences
        });
      }

      setMessage({
        type: "success",
        text: `Importação completa efetuada!`,
      });
    } catch (error) {
      console.error("Import error:", error);
      setMessage({
        type: "error",
        text: "Erro ao importar dados. Verifique se o ficheiro é válido.",
      });
    }

    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userName={""} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={""} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Definições</h1>
          <p className="text-muted-foreground">Gerir a sua conta e dados</p>
        </div>

        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-6"
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {message.type === "success" ? "Sucesso" : "Erro"}
            </AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Dados
              </CardTitle>
              <CardDescription>
                Faça download de todos os seus dados num ficheiro JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                O ficheiro incluirá todas as suas séries, conteúdos, listas, atores, definições e
                outros valores completos da base de dados. Pode usar este ficheiro para fazer backup ou
                migrar para outra conta.
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileJson className="h-4 w-4 mr-2" />
                    Exportar JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Dados
              </CardTitle>
              <CardDescription>
                Importe dados de um ficheiro JSON completo exportado anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Os dados importados serão adicionados ou atualizados sobre os seus dados existentes.
                (Dados com o mesmo ID são fundidos com sucesso para evitar perdas).
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                variant="outline"
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Ficheiro
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
