"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Film,
  Menu,
  X,
  User,
  LogOut,
  Plus,
  Settings,
  Users2,
  Mic,
  Tv,
  FolderKanban,
  BarChart4,
  Download,
  Upload,
  Sparkles,
  Layers,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Não renderizar nada durante SSR para evitar inconsistências
  if (!mounted) {
    return (
      <header className="border-b bg-linear-to-r from-background via-card/50 to-background sticky top-0 z-50 backdrop-blur-sm border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-r from-primary to-blue-500 rounded-lg blur opacity-30"></div>
              <Film className="h-6 w-6 relative text-primary" />
            </div>
            <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent font-bold">
              MovieTracker
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-linear-to-r from-background via-card/50 to-background sticky top-0 z-50 backdrop-blur-sm border-border/50 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold group relative"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-linear-to-r from-primary via-blue-500 to-primary rounded-full blur opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <div className="relative p-1.5 rounded-lg bg-linear-to-br from-primary/20 to-blue-500/20 backdrop-blur-sm">
              <Film className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent text-lg font-bold tracking-tight">
              MovieTracker
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1 tracking-wider">
              YOUR PERSONAL CINEMA
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg px-4 py-2 h-9"
            >
              <Link href="/dashboard">
                <BarChart4 className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg px-4 py-2 h-9"
                >
                  <Layers className="h-4 w-4" />
                  Catálogo
                  <ChevronDown className="h-4 w-4 opacity-70 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 border-border/50 shadow-xl backdrop-blur-sm bg-card/95"
              >
                <DropdownMenuLabel className="flex items-center gap-2 text-primary font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Explorar Catálogo
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Link
                    href="/content"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Todos os Conteúdos</span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                      Ver tudo
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Link
                    href="/series"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-blue-500" />
                      <span>Séries</span>
                    </div>
                    <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                      TV
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Link
                    href="/content/movies"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-emerald-500" />
                      <span>Filmes</span>
                    </div>
                    <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                      Longas
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Link
                    href="/content/shorts"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>Curtas</span>
                    </div>
                    <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                      Rápidas
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Link
                    href="/content/podcasts"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-purple-500" />
                      <span>Podcasts</span>
                    </div>
                    <span className="text-xs text-purple-500 bg-purple-500/10 px-2 py-1 rounded">
                      Áudio
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Link
                    href="/content/other"
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-pink-500" />
                      <span>Outros</span>
                    </div>
                    <span className="text-xs text-pink-500 bg-pink-500/10 px-2 py-1 rounded">
                      Especiais
                    </span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg px-4 py-2 h-9"
            >
              <Link href="/people">
                <Users2 className="h-4 w-4" />
                Pessoas
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg px-4 py-2 h-9"
            >
              <Link href="/collections">
                <FolderKanban className="h-4 w-4" />
                Coleções
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-lg px-4 py-2 h-9"
            >
              <Link href="/content/add">
                <Plus className="h-4 w-4" />
                Adicionar
              </Link>
            </Button>
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 h-9 w-9"
              >
                <User className="h-4.5 w-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-border/50 shadow-xl backdrop-blur-sm bg-card/95"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-semibold">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    Gerir a sua conta
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                asChild
                className="cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <Link href="/profile" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <Link href="/import" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Importar Dados
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <Link href="/export" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Exportar Dados
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <Link href="/settings" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Definições
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top-5 duration-300">
          <nav className="flex flex-col p-4 gap-3">
            <div className="mb-2 px-2">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                Navegação
              </p>
            </div>

            <Button
              asChild
              variant="ghost"
              className="justify-start gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all duration-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/dashboard">
                <BarChart4 className="h-5 w-5" />
                Dashboard
              </Link>
            </Button>

            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                Catálogo
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3 rounded-lg hover:bg-primary/10 hover:border-primary/30 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link
                    href="/content"
                    className="flex flex-col items-start gap-1"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Todos</span>
                    <span className="text-xs text-muted-foreground">
                      Ver tudo
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link
                    href="/series"
                    className="flex flex-col items-start gap-1"
                  >
                    <Tv className="h-4 w-4 text-blue-500" />
                    <span>Séries</span>
                    <span className="text-xs text-muted-foreground">
                      TV Shows
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link
                    href="/content/movies"
                    className="flex flex-col items-start gap-1"
                  >
                    <Film className="h-4 w-4 text-emerald-500" />
                    <span>Filmes</span>
                    <span className="text-xs text-muted-foreground">
                      Longas
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3 rounded-lg hover:bg-amber-500/10 hover:border-amber-500/30 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link
                    href="/content/shorts"
                    className="flex flex-col items-start gap-1"
                  >
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Curtas</span>
                    <span className="text-xs text-muted-foreground">
                      Rápidas
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3 rounded-lg hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link
                    href="/content/podcasts"
                    className="flex flex-col items-start gap-1"
                  >
                    <Mic className="h-4 w-4 text-purple-500" />
                    <span>Podcasts</span>
                    <span className="text-xs text-muted-foreground">Áudio</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-3 rounded-lg hover:bg-pink-500/10 hover:border-pink-500/30 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link
                    href="/content/other"
                    className="flex flex-col items-start gap-1"
                  >
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    <span>Outros</span>
                    <span className="text-xs text-muted-foreground">
                      Especiais
                    </span>
                  </Link>
                </Button>
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              className="justify-start gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/people">
                <Users2 className="h-5 w-5" />
                Pessoas
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="justify-start gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/collections">
                <FolderKanban className="h-5 w-5" />
                Coleções
              </Link>
            </Button>

            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs font-semibold text-primary mb-3 px-4 uppercase tracking-wider">
                Conta
              </p>
              <Button
                asChild
                variant="ghost"
                className="justify-start gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/profile">
                  <User className="h-5 w-5" />
                  Meu Perfil
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="justify-start gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/settings">
                  <Settings className="h-5 w-5" />
                  Definições
                </Link>
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                asChild
                className="w-full justify-center gap-2 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/content/add">
                  <Plus className="h-4 w-4" />
                  Adicionar Conteúdo
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// Componente auxiliar para ícone de seta
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
