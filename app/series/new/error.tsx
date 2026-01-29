// app/series/new/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold">Erro ao carregar página</h2>
        <p className="text-muted-foreground">
          Ocorreu um erro ao tentar carregar a página de criação de série.
        </p>
        <Button onClick={() => reset()}>Tentar novamente</Button>
      </div>
    </div>
  );
}
