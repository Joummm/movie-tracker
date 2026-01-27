import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Verifique seu email</CardTitle>
            <CardDescription className="text-center">
              Enviamos um link de confirmação para o seu email. Por favor, clique no link para ativar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Depois de confirmar, você pode{" "}
              <Link href="/auth/login" className="underline underline-offset-4 text-foreground">
                fazer login aqui
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
