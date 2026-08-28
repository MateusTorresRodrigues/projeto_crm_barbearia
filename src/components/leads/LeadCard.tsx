import { Clock, Tag } from "lucide-react"

import { formatarTempoRelativo } from "@/lib/horarios"
import type { CrmBarbearia } from "@/lib/types"
import { cn } from "@/lib/utils"

export function LeadCard({
  lead,
  onClick,
  onDragStart,
}: {
  lead: CrmBarbearia
  onClick: () => void
  onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void
}) {
  const semInteracao = new Date(lead.ultima_mensagem ?? lead.updated_at)

  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="w-full cursor-grab space-y-1.5 rounded-md border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/50 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium text-foreground">{lead.nome || lead.whatsapp}</p>
        {lead.tipo === "cliente" && (
          <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Cliente
          </span>
        )}
      </div>

      {lead.origem && (
        <p className={cn("flex items-center gap-1 text-xs text-muted-foreground")}>
          <Tag className="size-3" /> {lead.origem}
        </p>
      )}

      {lead.resumo_conversa && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{lead.resumo_conversa}</p>
      )}

      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock className="size-3" /> {formatarTempoRelativo(semInteracao)}
      </p>
    </button>
  )
}
