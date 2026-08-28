import { Scissors } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Emblema circular inspirado em brasões clássicos de barbearia.
 * Usado com moderação: tela de login e ícone do app.
 */
export function Emblema({
  logoUrl,
  nome,
  className,
}: {
  logoUrl?: string | null
  nome: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-secondary shadow-[0_0_0_4px_rgba(199,136,60,0.15)]",
        className
      )}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={nome}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <Scissors className="size-7 text-primary" strokeWidth={1.75} />
      )}
    </div>
  )
}
