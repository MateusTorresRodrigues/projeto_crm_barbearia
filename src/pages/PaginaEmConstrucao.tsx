import type { LucideIcon } from "lucide-react"

export function PaginaEmConstrucao({
  titulo,
  icone: Icone,
}: {
  titulo: string
  icone: LucideIcon
}) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
        <Icone className="size-6 text-primary" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">{titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta página será implementada em uma próxima etapa.
        </p>
      </div>
    </div>
  )
}
