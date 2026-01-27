"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, List, Pencil, Trash2, ImageIcon } from "lucide-react"
import type { ContentList } from "@/lib/types/database"

export default function ListsPage() {
  const router = useRouter()
  const [lists, setLists] = useState<ContentList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<ContentList | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverImage: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    setUserId(user.id)

    const { data: listsData } = await supabase
      .from("content_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setLists(listsData || [])
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()

    if (editingList) {
      await supabase
        .from("content_lists")
        .update({
          name: formData.name,
          description: formData.description || null,
          cover_image: formData.coverImage || null,
        })
        .eq("id", editingList.id)
    } else {
      await supabase.from("content_lists").insert({
        user_id: userId,
        name: formData.name,
        description: formData.description || null,
        cover_image: formData.coverImage || null,
      })
    }

    setIsDialogOpen(false)
    setEditingList(null)
    setFormData({ name: "", description: "", coverImage: "" })
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja apagar esta lista?")) return
    
    const supabase = createClient()
    await supabase.from("content_lists").delete().eq("id", id)
    loadData()
  }

  function openEditDialog(list: ContentList) {
    setEditingList(list)
    setFormData({
      name: list.name,
      description: list.description || "",
      coverImage: list.cover_image || "",
    })
    setIsDialogOpen(true)
  }

  function openNewDialog() {
    setEditingList(null)
    setFormData({ name: "", description: "", coverImage: "" })
    setIsDialogOpen(true)
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
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={""} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Minhas Listas</h1>
            <p className="text-muted-foreground">Organize os seus conteúdos em listas personalizadas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingList ? "Editar Lista" : "Nova Lista"}</DialogTitle>
                <DialogDescription>
                  {editingList ? "Atualize as informações da lista" : "Crie uma nova lista para organizar os seus conteúdos"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da lista"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da lista"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverImage">URL da Imagem de Capa</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.coverImage && (
                    <div className="mt-2 rounded-md overflow-hidden w-32 h-20">
                      <img 
                        src={formData.coverImage || "/placeholder.svg"} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingList ? "Guardar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {lists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <List className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma lista criada</h3>
              <p className="text-muted-foreground mb-4">Crie a sua primeira lista para organizar os conteúdos</p>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Lista
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Card 
                key={list.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`/lists/${list.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {list.cover_image ? (
                        <img 
                          src={list.cover_image || "/placeholder.svg"} 
                          alt={list.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        {list.description && (
                          <CardDescription className="line-clamp-1">
                            {list.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(list)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(list.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
