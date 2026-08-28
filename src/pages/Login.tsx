import * as React from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { Emblema } from "@/components/Emblema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useConfiguracao } from "@/contexts/ConfiguracaoContext"

export default function Login() {
  const { session, signIn } = useAuth()
  const { nomeNegocio, logoUrl } = useConfiguracao()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = React.useState("")
  const [senha, setSenha] = React.useState("")
  const [erro, setErro] = React.useState<string | null>(null)
  const [enviando, setEnviando] = React.useState(false)

  if (session) {
    const destino = (location.state as { from?: Location })?.from?.pathname || "/dashboard"
    return <Navigate to={destino} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const { error } = await signIn(email, senha)

    setEnviando(false)

    if (error) {
      setErro(error)
      return
    }

    navigate("/dashboard", { replace: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Emblema logoUrl={logoUrl} nome={nomeNegocio} />
          <h1 className="text-center font-display text-2xl font-semibold text-foreground">
            {nomeNegocio}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg"
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
