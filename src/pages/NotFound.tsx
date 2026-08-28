import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background text-center text-foreground">
      <h1 className="font-display text-4xl font-semibold text-primary">404</h1>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Button asChild>
        <Link to="/dashboard">Voltar ao início</Link>
      </Button>
    </div>
  )
}
