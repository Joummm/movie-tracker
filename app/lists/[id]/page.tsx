"use client";

import React from "react";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Film,
  Tv,
  GripVertical,
  Star,
  Clock,
} from "lucide-react";
import type {
  ContentList,
  ListItem,
  Content,
  Series,
} from "@/lib/types/database";

interface ListDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [list, setList] = useState<ContentList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [availableContent, setAvailableContent] = useState<Content[]>([]);
  const [availableSeries, setAvailableSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addType, setAddType] = useState<"content" | "series">("content");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Load list
    const { data: listData } = await supabase
      .from("content_lists")
      .select("*")
      .eq("id", id)
      .single();

    if (!listData) {
      router.push("/lists");
      return;
    }

    setList(listData);

    // Load list items with content and series
    const { data: itemsData } = await supabase
      .from("list_items")
      .select(
        `
        *,
        content(*),
        series(*)
      `,
      )
      .eq("list_id", id)
      .order("position");

    setItems(itemsData || []);

    // Load available content for adding
    const { data: contentData } = await supabase
      .from("content")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    setAvailableContent(contentData || []);

    // Load available series
    const { data: seriesData } = await supabase
      .from("series")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    setAvailableSeries(seriesData || []);
    setIsLoading(false);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    const supabase = createClient();
    const maxPosition =
      items.length > 0 ? Math.max(...items.map((i) => i.position)) + 1 : 0;

    await supabase.from("list_items").insert({
      list_id: id,
      content_id: addType === "content" ? selectedId : null,
      series_id: addType === "series" ? selectedId : null,
      position: maxPosition,
    });

    setIsDialogOpen(false);
    setSelectedId("");
    loadData();
  }

  async function handleRemoveItem(itemId: string) {
    const supabase = createClient();
    await supabase.from("list_items").delete().eq("id", itemId);
    loadData();
  }

  function getItemName(item: ListItem): string {
    if (item.content) {
      return item.content.name || `${item.content.type} sem nome`;
    }
    if (item.series) {
      return item.series.name || "Série sem nome";
    }
    return "Item desconhecido";
  }

  function getItemImage(item: ListItem): string | undefined {
    return item.content?.cover_image || item.series?.cover_image;
  }

  if (isLoading || !list) {
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
        <Button
          variant="ghost"
          onClick={() => router.push("/lists")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às Listas
        </Button>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {list.cover_image && (
              <img
                src={list.cover_image || "/placeholder.svg"}
                alt={list.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{list.name}</h1>
              {list.description && (
                <p className="text-muted-foreground">{list.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar à Lista</DialogTitle>
                <DialogDescription>
                  Escolha um conteúdo ou série para adicionar à lista
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={addType}
                    onValueChange={(v) => setAddType(v as "content" | "series")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">Conteúdo</SelectItem>
                      <SelectItem value="series">Série</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{addType === "content" ? "Conteúdo" : "Série"}</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {addType === "content"
                        ? availableContent.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name || `${c.type} sem nome`}
                            </SelectItem>
                          ))
                        : availableSeries.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name || "Série sem nome"}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!selectedId}>
                    Adicionar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Film className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lista vazia</h3>
              <p className="text-muted-foreground mb-4">
                Adicione conteúdos ou séries a esta lista
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <Card
                key={item.id}
                className="hover:bg-accent/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    {getItemImage(item) ? (
                      <img
                        src={getItemImage(item) || "/placeholder.svg"}
                        alt={getItemName(item)}
                        className="w-12 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                        {item.series ? (
                          <Tv className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Film className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {getItemName(item)}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {item.content?.type && (
                          <span className="capitalize">
                            {item.content.type}
                          </span>
                        )}
                        {item.series && <span>Série</span>}
                        {item.content?.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {item.content.rating.toFixed(1)}
                          </span>
                        )}
                        {item.content?.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.content.duration}min
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
