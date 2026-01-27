"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Film, Menu, X, User, LogOut, Plus, List, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DashboardHeaderProps {
  userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Film className="h-6 w-6" />
          <span>Movie Tracker</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/content">Conteúdos</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/series">Séries</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/lists">Listas</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/content/add">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Link>
            </Button>
          </nav>

          {/* User Menu - Desktop & Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">Minha Conta</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Definições
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <nav className="container mx-auto flex flex-col p-4 gap-2">
            <Button asChild variant="ghost" className="justify-start" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/content">Conteúdos</Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/series">Séries</Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/lists">
                <List className="h-4 w-4 mr-2" />
                Listas
              </Link>
            </Button>
            <Button asChild className="justify-start" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/content/add">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Conteúdo
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
