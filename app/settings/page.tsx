"use client";

import React from "react";

import { useState, useEffect, useRef } from "react";
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
  profile: Record<string, unknown>;
  series: Record<string, unknown>[];
  content: Record<string, unknown>[];
  lists: Record<string, unknown>[];
  listItems: Record<string, unknown>[];
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

      // Fetch all user data
      const [profileRes, seriesRes, contentRes, listsRes, listItemsRes] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase.from("series").select("*").eq("user_id", userId),
          supabase.from("content").select("*").eq("user_id", userId),
          supabase.from("content_lists").select("*").eq("user_id", userId),
          supabase.from("list_items").select("*"),
        ]);

      // Filter list items to only include items from user's lists
      const userListIds = (listsRes.data || []).map((l) => l.id);
      const userListItems = (listItemsRes.data || []).filter((item) =>
        userListIds.includes(item.list_id),
      );

      const exportData: ExportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        profile: profileRes.data || {},
        series: seriesRes.data || [],
        content: contentRes.data || [],
        lists: listsRes.data || [],
        listItems: userListItems,
      };

      // Create and download file
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

      setMessage({ type: "success", text: "Dados exportados com sucesso!" });
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
      const data: ExportData = JSON.parse(text);

      if (!data.version || !data.series || !data.content) {
        throw new Error("Ficheiro inválido");
      }

      const supabase = createClient();

      // Create mapping for old IDs to new IDs
      const seriesIdMap = new Map<string, string>();
      const listIdMap = new Map<string, string>();
      const contentIdMap = new Map<string, string>();

      // Import series
      for (const series of data.series) {
        const oldId = series.id as string;
        const { data: newSeries, error } = await supabase
          .from("series")
          .insert({
            user_id: userId,
            name: series.name,
            cover_image: series.cover_image,
            status: series.status,
            release_year: series.release_year,
          })
          .select()
          .single();

        if (!error && newSeries) {
          seriesIdMap.set(oldId, newSeries.id);
        }
      }

      // Import content
      for (const content of data.content) {
        const oldId = content.id as string;
        const oldSeriesId = content.series_id as string | null;
        const newSeriesId = oldSeriesId ? seriesIdMap.get(oldSeriesId) : null;

        const { data: newContent, error } = await supabase
          .from("content")
          .insert({
            user_id: userId,
            type: content.type,
            name: content.name,
            cover_image: content.cover_image,
            rating: content.rating,
            duration: content.duration,
            release_year: content.release_year,
            series_id: newSeriesId,
            season: content.season,
            episode: content.episode,
            watched_date: content.watched_date,
            watched_year: content.watched_year,
            watched_month: content.watched_month,
            date_precision: content.date_precision,
            notes: content.notes,
          })
          .select()
          .single();

        if (!error && newContent) {
          contentIdMap.set(oldId, newContent.id);
        }
      }

      // Import lists
      for (const list of data.lists) {
        const oldId = list.id as string;
        const { data: newList, error } = await supabase
          .from("content_lists")
          .insert({
            user_id: userId,
            name: list.name,
            description: list.description,
            cover_image: list.cover_image,
            is_public: list.is_public || false,
          })
          .select()
          .single();

        if (!error && newList) {
          listIdMap.set(oldId, newList.id);
        }
      }

      // Import list items
      for (const item of data.listItems) {
        const oldListId = item.list_id as string;
        const oldContentId = item.content_id as string | null;
        const oldSeriesId = item.series_id as string | null;

        const newListId = listIdMap.get(oldListId);
        const newContentId = oldContentId
          ? contentIdMap.get(oldContentId)
          : null;
        const newSeriesId = oldSeriesId ? seriesIdMap.get(oldSeriesId) : null;

        if (newListId && (newContentId || newSeriesId)) {
          await supabase.from("list_items").insert({
            list_id: newListId,
            content_id: newContentId,
            series_id: newSeriesId,
            position: item.position,
            notes: item.notes,
          });
        }
      }

      setMessage({
        type: "success",
        text: `Importação concluída! ${data.series.length} séries, ${data.content.length} conteúdos e ${data.lists.length} listas importadas.`,
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
        <DashboardHeader />
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
      <DashboardHeader />
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
                O ficheiro incluirá todas as suas séries, conteúdos, listas e
                configurações. Pode usar este ficheiro para fazer backup ou
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
                Importe dados de um ficheiro JSON exportado anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Os dados importados serão adicionados aos seus dados existentes.
                Não irá substituir ou apagar conteúdos existentes.
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
