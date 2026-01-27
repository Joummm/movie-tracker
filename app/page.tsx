import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Film } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Film className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Movie Tracker
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Acompanhe todos os filmes e séries que você assiste. Organize por
          data, avalie e guarde suas memórias.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/auth/sign-up">Criar Conta</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/login">Entrar</Link>
        </Button>
      </div>
    </div>
  );
}
