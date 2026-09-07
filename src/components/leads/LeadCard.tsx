import { ArrowRightLeft, Clock, Tag } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatarTempoRelativo } from "@/lib/horarios"
import { COLUNAS_STATUS_CRM } from "@/lib/statusCrm"
import type { CrmBarbearia, StatusCrm } from "@/lib/types"
import { cn } from "@/lib/utils"

export function LeadCard({
  lead,
  onClick,
  onDragStart,
  onMoverPara,
}: {
  lead: CrmBarbearia
  onClick: () => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void
  onMoverPara: (status: StatusCrm) => void
}) {
  const semInteracao = new Date(lead.ultima_mensagem ?? lead.updated_at)
  const outrasColunas = COLUNAS_STATUS_CRM.filter((c) => c.valor !== lead.status)

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="w-full cursor-grab space-y-1.5 rounded-md border border-border bg-card p-3 text-left shadow-sm outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium text-foreground">{lead.nome || lead.whatsapp}</p>
        <div className="flex shrink-0 items-center gap-1">
          {lead.tipo === "cliente" && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Cliente
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Mover lead para outra coluna"
              title="Mover para outra coluna"
            >
              <ArrowRightLeft className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Mover para</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {outrasColunas.map((c) => (
                <DropdownMenuItem key={c.valor} onClick={() => onMoverPara(c.valor)}>
                  {c.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
    </div>
  )
}
